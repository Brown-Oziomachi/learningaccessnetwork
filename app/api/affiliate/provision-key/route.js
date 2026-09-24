// app/api/affiliate/provision-key/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Provisions an affiliate API key for the authenticated user.
// Called by the AffiliateDeveloperSuiteClient when a user has no key yet.
// Uses Admin SDK exclusively — never client-writable.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getAdminDb, admin } from '@/lib/firebase-admin';
import crypto from 'crypto';

const err = (status, msg) => NextResponse.json({ success: false, error: msg }, { status });

// ── POST /api/affiliate/provision-key ────────────────────────────────────────
export async function POST(request) {
    const adminDb = getAdminDb();

// ── 1. Verify user identity from Authorization header ────────────────────
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '').trim();
    if (!idToken) return err(401, 'Missing Authorization header.');

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
        return err(401, 'Invalid or expired ID token.');
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // ── 2. Check if a key already exists for this user ───────────────────────
    const existing = await adminDb
        .collection('api_keys')
        .where('ownerUid', '==', uid)
        .where('status', '==', 'active')
        .limit(1)
        .get();

    if (!existing.empty) {
        const d = existing.docs[0];
        return NextResponse.json({ success: true, keyId: d.id, data: d.data() });
    }

    // ── 3. Generate new key ──────────────────────────────────────────────────
    // Format: lan_live_<32 random hex chars>
    const rawKey = `lan_live_${crypto.randomBytes(20).toString('hex')}`;

    // Developer ID: lan_<first 8 chars of uid>
    const developerId = `lan_${uid.slice(0, 8)}`;

    // Affiliate name: derive from email prefix or display name
    const affiliateName =
        decodedToken.name ||
        email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() ||
        'LAN Affiliate';

// ── 4. Persist key to database ───────────────────────────────────────────
    const keyPayload = {
        apiKey: rawKey,
        developerId,
        affiliateName,
        ownerUid: uid,
        ownerEmail: email,
        status: 'active',
        allowedOrigins: [],
        requestCount: 0,
        lastUsed: null,
        createdAt: new Date().toISOString(),
        plan: 'free',           // future: basic / pro / enterprise
        rateLimit: 1000,        // requests/day (enforced separately if needed)
    };

    const ref = await adminDb.collection('api_keys').add(keyPayload);

    return NextResponse.json({
        success: true,
        keyId: ref.id,
        data: keyPayload,
    });
}