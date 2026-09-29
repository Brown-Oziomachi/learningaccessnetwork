// app/api/flutterwave/create-subaccount/route.js

import { NextResponse } from 'next/server';
import { getCountry } from '@/lib/africanCountries';

const toE164 = (phone, dial) => {
    if (!phone) return phone;
    const p = phone.replace(/\s+/g, '');
    return p.startsWith('+') ? p : p.replace(/^0/, dial);
};

export async function POST(req) {
    try {
        const body = await req.json();
        const { email, firstName, surname, uid } = body;
        console.log('🏦 Bank details being sent:', {
            account_bank: body.bankCode,
            account_number: body.accountNumber,
        });

        console.log('🔑 Key being used:', process.env.FLUTTERWAVE_SECRET_KEY?.substring(0, 20) + '...');
        
        const country = getCountry(body.country);
        const payload = {            account_bank: body.bankCode,
            account_number: body.accountNumber,
            business_name: body.businessName || `${body.firstName} ${body.surname}`,
            business_email: body.email,
            business_contact: `${body.firstName} ${body.surname}`,
            business_contact_mobile: toE164(body.phoneNumber, country.dial),
            business_mobile: toE164(body.phoneNumber, country.dial),
            country: country.code,
            split_type: "percentage",
            split_value: 0.8,
        };

        console.log('📦 Full payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('https://api.flutterwave.com/v3/subaccounts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });


        const data = await response.json();
        console.log('🔥 Flutterwave response:', JSON.stringify(data, null, 2)); // add this

        if (data.status === 'success') {
            return NextResponse.json({
                success: true,
                subaccount_id: data.data.subaccount_id,
            });
        } else {
            console.error('Flutterwave subaccount error:', data);
            return NextResponse.json({ success: false, error: data.message }, { status: 400 });
        }
    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}