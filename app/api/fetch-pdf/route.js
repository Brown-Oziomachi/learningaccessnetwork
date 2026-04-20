// app/api/fetch-pdf/route.js
// Proxies Google Drive and Firebase Storage PDFs to bypass browser CORS restrictions.
// The client calls: GET /api/fetch-pdf?url=<encoded_url>
// This server fetches the file with full credentials and streams bytes back to the browser.

import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    let fetchUrl = rawUrl;

    // Convert Google Drive view/embed URLs to direct download URLs
    // Handles: /file/d/{id}/view, /file/d/{id}/preview, /open?id={id}
    const driveMatch = rawUrl.match(/\/d\/([\w-]{25,})|[?&]id=([\w-]{25,})/);
    if (rawUrl.includes('drive.google.com') && driveMatch) {
        const fileId = driveMatch[1] || driveMatch[2];
        fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=1`;
    }

    try {
        const upstream = await fetch(fetchUrl, {
            headers: {
                // Mimic a real browser to avoid Google's bot detection
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://drive.google.com/',
            },
            redirect: 'follow',
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream fetch failed: ${upstream.status} ${upstream.statusText}` },
                { status: upstream.status }
            );
        }

        const contentType = upstream.headers.get('content-type') || 'application/pdf';
        const buffer = await upstream.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': buffer.byteLength.toString(),
                // Allow the browser to cache this response for 1 hour
                'Cache-Control': 'private, max-age=3600',
                // Required CORS headers so the browser JS can read the blob
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
        });
    } catch (err) {
        console.error('[fetch-pdf proxy error]', err);
        return NextResponse.json(
            { error: 'Failed to fetch PDF', detail: err.message },
            { status: 500 }
        );
    }
}