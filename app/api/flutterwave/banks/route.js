// app/api/flutterwave/banks/route.js
import { NextResponse } from 'next/server';
import { flwRequest } from '@/lib/flutterwaveToken';
import { getCountry } from '@/lib/africanCountries';

// In-memory cache per country so we don't hit Flutterwave on every page load
const cache = new Map();
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(req) {
    try {
        const country = (new URL(req.url).searchParams.get('country') || 'NG').toUpperCase();

        const countryInfo = getCountry(country);
        if (!countryInfo) {
            return NextResponse.json({ success: false, error: 'Unsupported country' }, { status: 400 });
        }
        if (!countryInfo.bankList) {
            return NextResponse.json(
                { success: false, error: 'Bank list is not available for this country.' },
                { status: 400 }
            );
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

        const seen = new Set();
        const banks = data.data
            .filter((b) => b?.code && b?.name)
            .map((b) => ({ name: String(b.name).trim(), code: String(b.code) }))
            .filter((b) => {
                const key = `${b.code}|${b.name}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // Don't cache an empty list for 6 hours; the next request should retry
        if (banks.length > 0) cache.set(country, { banks, at: Date.now() });
        return NextResponse.json({ success: true, banks });
    } catch (error) {
        console.error('Banks route error:', error);
        return NextResponse.json({ success: false, error: 'Could not load banks' }, { status: 500 });
    }
}