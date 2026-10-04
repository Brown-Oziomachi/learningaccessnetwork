// app/api/seller/bank-details/route.js
// Server-side bank detail updates: verification + duplicate-account protection.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getCountry } from '@/lib/africanCountries';

// Countries where Flutterwave's resolve endpoint works (per its docs: Nigeria and Ghana)
const RESOLVABLE_COUNTRIES = ['NG', 'GH'];

class DuplicateAccountError extends Error {}
class NotSellerError extends Error {}

const cleanPart = (v) => String(v || '').replace(/[^A-Za-z0-9]/g, '');
const makeAccountKey = (country, bankCode, accountNumber) =>
  [country, bankCode, accountNumber].map(cleanPart).join('_');

// Returns { ok: true, accountName } | { ok: false, error } | { ok: null } when it could not be checked.
async function resolveBankAccount(accountNumber, bankCode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data.status === 'success' && data.data?.account_name) {
      return { ok: true, accountName: data.data.account_name };
    }
    console.error('Account resolve failed:', data.message);
    return { ok: false, error: data.message || 'Could not verify account.' };
  } catch (err) {
    console.error('Account resolve unavailable:', err.message);
    return { ok: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  try {
    // 1. Authenticate
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { uid } = await adminAuth.verifyIdToken(token);

    // 2. Validate
    const body = await req.json();
    const { bankName, bankCode, accountName, country } = body;
    const accountNumber = cleanPart(body.accountNumber);

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (!getCountry(country)) {
      return NextResponse.json({ success: false, error: 'Unsupported country.' }, { status: 400 });
    }
    if (country === 'NG' && !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, error: 'Nigerian account numbers must be 10 digits.' }, { status: 400 });
    }

    // 3. Verify with Flutterwave where possible
    let verifiedAccountName = accountName;
    let accountVerified = false;
    if (RESOLVABLE_COUNTRIES.includes(country)) {
      const check = await resolveBankAccount(accountNumber, bankCode);
      if (check.ok === false) {
        return NextResponse.json(
          { success: false, error: "We couldn't verify your account number. Check the bank and account number and try again." },
          { status: 400 }
        );
      }
      if (check.ok === true) {
        verifiedAccountName = check.accountName;
        accountVerified = true;
      }
    }

    // 4. Swap the duplicate-check record and update the seller in one transaction
    const sellerRef = adminDb.doc(`sellers/${uid}`);
    const userRef = adminDb.doc(`users/${uid}`);
    const newKey = makeAccountKey(country, bankCode, accountNumber);
    const newIndexRef = adminDb.doc(`sellerBankAccounts/${newKey}`);

    const saved = {
      country,
      bankName,
      bankCode: String(bankCode),
      accountNumber,
      accountName: verifiedAccountName,
      accountVerified,
    };

    await adminDb.runTransaction(async (tx) => {
      // All reads first
      const sellerSnap = await tx.get(sellerRef);
      if (!sellerSnap.exists) throw new NotSellerError();

      const newIndexSnap = await tx.get(newIndexRef);
      if (newIndexSnap.exists && newIndexSnap.data().uid !== uid) throw new DuplicateAccountError();

      const old = sellerSnap.data().bankDetails || {};
      const oldKey = old.country && old.bankCode && old.accountNumber
        ? makeAccountKey(old.country, old.bankCode, old.accountNumber)
        : null;
      let oldIndexRef = null;
      let oldIndexSnap = null;
      if (oldKey && oldKey !== newKey) {
        oldIndexRef = adminDb.doc(`sellerBankAccounts/${oldKey}`);
        oldIndexSnap = await tx.get(oldIndexRef);
      }

      // Then writes
      tx.set(newIndexRef, {
        uid,
        country,
        bankCode: String(bankCode),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (oldIndexSnap?.exists && oldIndexSnap.data().uid === uid) {
        tx.delete(oldIndexRef); // release the old account so someone else can use it
      }

      tx.set(sellerRef, { bankDetails: saved, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(userRef, { bankDetails: saved, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    return NextResponse.json({ success: true, bankDetails: saved });
  } catch (error) {
    if (error instanceof DuplicateAccountError) {
      return NextResponse.json(
        { success: false, error: 'This bank account is already registered to another seller. If it is yours, contact support.' },
        { status: 409 }
      );
    }
    if (error instanceof NotSellerError) {
      return NextResponse.json({ success: false, error: 'Seller profile not found.' }, { status: 404 });
    }
    console.error('bank-details error:', error);
    return NextResponse.json({ success: false, error: 'Could not save bank details.' }, { status: 500 });
  }
}