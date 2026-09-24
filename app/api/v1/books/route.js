// app/api/v1/books/route.js
// ─────────────────────────────────────────────────────────────────────────────
// LAN Library Public Affiliate API  ·  v1
//
// AUTH:  x-api-key header  (value = api_keys.apiKey in Firestore)
// CORS:  origin must be in api_keys.allowedOrigins  (server-to-server always OK)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Helper: build a uniform error response
const err = (status, message) =>
    NextResponse.json({ success: false, error: message }, {
        status,
        headers: corsHeaders('*'),
    });

// Helper: CORS headers scoped to a specific origin (or '*' for errors)
function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Vary': 'Origin',
    };
}

// ── OPTIONS preflight ────────────────────────────────────────────────────────
export async function OPTIONS(request) {
    const origin = request.headers.get('origin') || '*';
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ── GET /api/v1/books ────────────────────────────────────────────────────────
export async function GET(request) {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);
    const incomingOrigin = request.headers.get('origin') || null; // null = server-to-server

    // ── 1. Extract API key ───────────────────────────────────────────────────
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return err(401, 'Missing x-api-key header.');

    // ── 2. Look up the key in Firestore ─────────────────────────────────────
    let keyDoc = null;
    try {
        const snap = await adminDb
            .collection('api_keys')
            .where('apiKey', '==', apiKey)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (snap.empty) return err(403, 'Invalid or inactive API key.');
        keyDoc = snap.docs[0];
    } catch (e) {
        console.error('[LAN API] Firestore key lookup error:', e);
        return err(500, 'Server error during authentication.');
    }

    const keyData = keyDoc.data();

    // ── 3. Origin whitelist check (browser requests only) ────────────────────
    // Server-to-server calls (no Origin header) are always allowed.
    if (incomingOrigin) {
        const allowedOrigins = keyData.allowedOrigins || [];

        // If NO origins are registered → block browser requests to prevent key misuse
        if (allowedOrigins.length === 0) {
            return err(403,
                'Browser requests blocked: no domains are registered for this key. ' +
                'Add an allowed origin in your LAN Affiliate Developer Suite, or call this API server-to-server.'
            );
        }

        const originAllowed = allowedOrigins.some(pattern => {
            if (pattern.startsWith('*.')) {
                // Wildcard: *.example.com matches sub.example.com
                const suffix = pattern.slice(1); // .example.com
                return incomingOrigin.endsWith(suffix);
            }
            return incomingOrigin === pattern;
        });

        if (!originAllowed) {
            return err(403, `Origin "${incomingOrigin}" is not registered for this API key.`);
        }
    }

    // ── 4. Parse query params ────────────────────────────────────────────────
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1), 100);
    const category = searchParams.get('category') || null;
    const affiliateId = keyData.developerId;

    // ── 5. Query books collection ────────────────────────────────────────────
    let books = [];
    try {
        let q = adminDb.collection('advertMyBook')
            .where('status', '==', 'approved') // Only approved, published books
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (category && category !== 'all') {
            q = adminDb.collection('advertMyBook')
                .where('status', '==', 'approved')
                .where('category', '==', category)
                .orderBy('createdAt', 'desc')
                .limit(limit);
        }

        const snap = await q.get();

        books = snap.docs.map(d => {
            const b = d.data();
            const slug = b.slug || d.id;
            return {
                id: d.id,
                title: b.bookTitle || '',
                author: b.author || b.sellerName || '',
                category: b.category || '',
                coverImage: b.coverImage || b.thumbnail || '',
                description: b.description || '',
                price: typeof b.price === 'number' ? b.price : 0,
                currency: 'NGN',
                slug,
                // Affiliate purchase URL — includes ?aff= so sales are tracked
                affiliatePurchaseUrl:
                    `https://www.lanlibrary.com/book/preview?id=${slug}&aff=${affiliateId}`,
            };
        });
    } catch (e) {
        console.error('[LAN API] Firestore books query error:', e);
        return err(500, 'Failed to fetch books.');
    }

    // ── 6. Update usage stats (fire-and-forget, don't block response) ────────
    adminDb.collection('api_keys').doc(keyDoc.id).update({
        requestCount: (keyData.requestCount || 0) + 1,
        lastUsed: new Date().toISOString(),
    }).catch(e => console.warn('[LAN API] Failed to update requestCount:', e));

    // ── 7. Return response ───────────────────────────────────────────────────
    return NextResponse.json(
        {
            success: true,
            affiliate: keyData.affiliateName || keyData.developerId,
            count: books.length,
            data: books,
        },
        {
            status: 200,
            headers: {
                ...corsHeaders(incomingOrigin || '*'),
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        }
    );
}