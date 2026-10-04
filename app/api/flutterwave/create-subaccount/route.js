// app/api/flutterwave/create-subaccount/route.js
// Registers a seller: verifies the bank account, blocks duplicate accounts,
// then writes the seller records. (No Flutterwave subaccount is created.)
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isReservedName, RESERVED_MESSAGE } from '@/lib/reservedIdentity';
import { getCountry } from '@/lib/africanCountries';

// Countries where Flutterwave's resolve endpoint works (per its docs: Nigeria and Ghana)
const RESOLVABLE_COUNTRIES = ['NG', 'GH'];

// One-time bonus credited to a new seller's balance (in NGN). Set to 0 to turn it off.
const WELCOME_BONUS = 50;

class DuplicateAccountError extends Error {}

// Verifies the account number with Flutterwave and returns the registered account name.
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
    // Timeout or network failure: do not block registration on a Flutterwave outage
    console.error('Account resolve unavailable:', err.message);
    return { ok: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  try {
    // 1. Authenticate: never trust a uid sent in the body
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { uid, email: tokenEmail } = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const {
      firstName, surname, phoneNumber, bankCode, bankName, accountName,
      businessName, businessDescription, title, university, department, country,
    } = body;
    const email = tokenEmail || body.email;

    // Normalise the account number so "012 345-6789" and "0123456789" count as the same account
    const accountNumber = String(body.accountNumber || '').replace(/[^A-Za-z0-9]/g, '');

    // 2. Server-side validation (client checks can be bypassed)
    if (!phoneNumber || !bankCode || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (!getCountry(country)) {
      return NextResponse.json({ success: false, error: 'Unsupported country.' }, { status: 400 });
    }
    if (country === 'NG' && !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, error: 'Nigerian account numbers must be 10 digits.' }, { status: 400 });
    }
    if (businessName && isReservedName(businessName)) {
      return NextResponse.json({ success: false, error: RESERVED_MESSAGE }, { status: 400 });
    }

    // 3. Idempotency: don't register the same seller twice
    const userRef = adminDb.doc(`users/${uid}`);
    const existing = (await userRef.get()).data() || {};
    if (existing.isSeller) {
      return NextResponse.json({ success: true, alreadySeller: true });
    }

    // 4. Verify the bank account where Flutterwave can resolve it (NG and GH).
    // Other countries are saved as unverified so you can check them before the first payout.
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

    // 5. Claim the bank account and write the seller records in ONE transaction.
    // The index doc id is country + bank + account number, so a second seller
    // trying the same account hits the same doc and is rejected.
    const displayName = `${firstName} ${surname}`.trim();
    const accountKey = [country, bankCode, accountNumber]
      .map((p) => String(p).replace(/[^A-Za-z0-9]/g, ''))
      .join('_');
    const indexRef = adminDb.doc(`sellerBankAccounts/${accountKey}`);
    const sellerRef = adminDb.doc(`sellers/${uid}`);

      let bonusGranted = false;

      await adminDb.runTransaction(async (tx) => {
          const indexSnap = await tx.get(indexRef);
          const sellerSnap = await tx.get(sellerRef);
          const userSnap = await tx.get(userRef);

          // One-time welcome bonus: only if this user has never received it
          const grantBonus = WELCOME_BONUS > 0 && userSnap.data()?.welcomeBonusGranted !== true;
          bonusGranted = grantBonus;

      if (indexSnap.exists && indexSnap.data().uid !== uid) {
        throw new DuplicateAccountError();
      }

      tx.set(indexRef, {
        uid,
        country,
        bankCode: String(bankCode),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

          tx.set(userRef, {
              isSeller: true,
              phoneNumber,
              ...(grantBonus ? { welcomeBonusGranted: true, welcomeBonusAmount: WELCOME_BONUS } : {}),
              updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

      tx.set(sellerRef, {
          // Only start the counters for a brand-new seller doc. A sale may already have
          // credited this seller, and merge:true would reset those numbers to 0.
          ...(sellerSnap.exists ? {} : { totalEarnings: 0, booksSold: 0, totalWithdrawn: 0 }),
          // Welcome bonus: increment keeps any balance a sale already added.
          // Otherwise a brand-new doc starts at 0.
          ...(grantBonus
              ? { accountBalance: FieldValue.increment(WELCOME_BONUS) }
              : (sellerSnap.exists ? {} : { accountBalance: 0 })),
        bankDetails: {
          country,
          bankName,
          bankCode,
          accountNumber,
          accountName: verifiedAccountName,
          accountVerified,
        },
        businessInfo: {
          businessName: businessName || displayName,
          businessDescription: businessDescription || '',
        },
        sellerName: displayName,
        sellerId: uid,
        sellerEmail: email,
        title: title || '',
        university: university || '',
        department: department || '',
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

      return NextResponse.json({ success: true, welcomeBonus: bonusGranted ? WELCOME_BONUS : 0 });
  } catch (error) {
      if (error instanceof DuplicateAccountError) {
      return NextResponse.json(
        { success: false, error: 'This bank account is already registered to another seller. If it is yours, contact support.' },
        { status: 409 }
      );
    }
    console.error('create-subaccount error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}