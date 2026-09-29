// app/api/flutterwave/banks/route.js
import { NextResponse } from 'next/server';
import { flwRequest } from '@/lib/flutterwaveToken';
import { AFRICAN_COUNTRIES } from '@/lib/africanCountries';

// In-memory cache per country so we don't hit Flutterwave on every page load
const cache = new Map();
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(req) {
    try {
        const country = (new URL(req.url).searchParams.get('country') || 'NG').toUpperCase();

        if (!AFRICAN_COUNTRIES.some((c) => c.code === country)) {
            return NextResponse.json({ success: false, error: 'Unsupported country' }, { status: 400 });
        }

        const hit = cache.get(country);
        if (hit && Date.now() - hit.at < TTL_MS) {
            return NextResponse.json({ success: true, banks: hit.banks });
        }

        const { status, data } = await flwRequest('GET', `/v3/banks/${country}`);

        if (status !== 200 || data.status !== 'success' || !Array.isArray(data.data)) {
            console.error('Flutterwave banks error:', status, data);
            return NextResponse.json(
                { success: false, error: data.message || 'Could not load banks' },
                { status: 502 }
            );
        }

        const banks = data.data
            .map((b) => ({ name: b.name, code: String(b.code) }))
            .sort((a, b) => a.name.localeCompare(b.name));

        cache.set(country, { banks, at: Date.now() });
        return NextResponse.json({ success: true, banks });
    } catch (error) {
        console.error('Banks route error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}