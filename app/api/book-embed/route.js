import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
    try {
        const { bookId } = await request.json();

        // 1. Check database records for the verified document matching this book
        const db = getAdminDb();
        const bookDoc = await db.collection('advertMyBook').doc(bookId).get();

        if (!bookDoc.exists) {
            return NextResponse.json({ error: 'Book validation failed' }, { status: 404 });
        }

        const bookData = bookDoc.data();
        const fileTargetUrl = bookData.pdfUrl || bookData.pdfLink;

        // 2. Fetch the file server-to-server from your private bucket
        const fileResponse = await fetch(fileTargetUrl);
        const fileBuffer = await fileResponse.arrayBuffer();

        // 3. Stream the raw bytes directly back to the app client 
        // The user's browser only sees the stream incoming from this API endpoint
        return new Response(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="protected-stream"'
            }
        });

    } catch (err) {
        return NextResponse.json({ error: 'Internal system processing failure' }, { status: 500 });
    }
}