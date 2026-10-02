// app/api/flutterwave/create-subaccount/route.js
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getCountry } from '@/lib/africanCountries';
import { isReservedName, RESERVED_MESSAGE } from '@/lib/reservedIdentity';

const toE164 = (phone, dial) => {
  if (!phone) return phone;
  const p = phone.replace(/\s+/g, '');
  return p.startsWith('+') ? p : p.replace(/^0/, dial);
};

export async function POST(req) {
  try {
    // 1. Authenticate: never trust a uid sent in the body
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { uid, email: tokenEmail } = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const {
      firstName, surname, phoneNumber, bankCode, bankName, accountNumber, accountName,
      businessName, businessDescription, title, university, department,
    } = body;
    const email = tokenEmail || body.email;

    // 2. Server-side validation (client checks can be bypassed)
    if (!phoneNumber || !bankCode || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (businessName && isReservedName(businessName)) {
      return NextResponse.json({ success: false, error: RESERVED_MESSAGE }, { status: 400 });
    }

    // 3. Idempotency: don't create a second subaccount on retry
    const userRef = adminDb.doc(`users/${uid}`);
    const existing = (await userRef.get()).data() || {};
    if (existing.isSeller) {
      return NextResponse.json({ success: true, subaccount_id: existing.flutterwaveSubaccountId, alreadySeller: true });
    }

    let subaccountId = existing.flutterwaveSubaccountId;

    // 4. Create the Flutterwave subaccount only if we don't have one yet
    if (!subaccountId) {
      const country = getCountry(body.country);
      const fwRes = await fetch('https://api.flutterwave.com/v3/subaccounts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          business_name: businessName || `${firstName} ${surname}`,
          business_email: email,
          business_contact: `${firstName} ${surname}`,
          business_contact_mobile: toE164(phoneNumber, country.dial),
          business_mobile: toE164(phoneNumber, country.dial),
          country: country.code,
          split_type: 'percentage',
          split_value: 0.8,
        }),
      });
      const data = await fwRes.json();
      if (data.status !== 'success') {
        console.error('Flutterwave subaccount error:', data.message);
        return NextResponse.json({ success: false, error: data.message }, { status: 400 });
      }
      subaccountId = data.data.subaccount_id;
    }

    // 5. Write Firestore with the Admin SDK (bypasses rules, which is the point)
    const displayName = `${firstName} ${surname}`.trim();
    const batch = adminDb.batch();

    batch.set(userRef, {
      isSeller: true,
      phoneNumber,
      flutterwaveSubaccountId: subaccountId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    batch.set(adminDb.doc(`sellers/${uid}`), {
      accountBalance: 0,
      totalEarnings: 0,
      booksSold: 0,
      totalWithdrawn: 0,
      bankDetails: { country: body.country, bankName, bankCode, accountNumber, accountName },
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
      flutterwaveSubaccountId: subaccountId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({ success: true, subaccount_id: subaccountId });
  } catch (error) {
    console.error('create-subaccount error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}