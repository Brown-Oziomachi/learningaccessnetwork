import { adminDb } from "@/lib/firebase-admin";

// Masks email: john@gmail.com → j***@gmail.com
function maskEmail(email) {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local[0]}***@${domain}`;
}

// Masks phone: +2348012345678 → +234 *** ***5678
function maskPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 6) return phone;
    return cleaned.slice(0, 4) + ' *** ***' + cleaned.slice(-4);
}

export async function POST(req) {
    try {
        // Guard — your firebaseAdmin exports null if env vars are missing
        if (!adminDb) {
            return Response.json(
                { error: 'Server configuration error. Please try again later.' },
                { status: 500 }
            );
        }

        const { searchTerm } = await req.json();

        if (!searchTerm || searchTerm.trim().length < 3) {
            return Response.json(
                { error: 'Please enter at least 3 characters' },
                { status: 400 }
            );
        }

        const term = searchTerm.trim().toLowerCase();
        const usersRef = adminDb.collection('users');
        const isEmail = term.includes('@');

        let snap;

        if (isEmail) {
            // Exact email match
            snap = await usersRef.where('email', '==', term).limit(1).get();
        } else {
            // Try phone field first, then phoneNumber
            snap = await usersRef.where('phone', '==', term).limit(1).get();
            if (snap.empty) {
                snap = await usersRef.where('phoneNumber', '==', term).limit(1).get();
            }
        }

        if (snap.empty) {
            return Response.json({ found: false });
        }

        const userData = snap.docs[0].data();
        const accountStatus = userData.accountStatus || 'active';

        return Response.json({
            found: true,
            accountStatus,
            maskedEmail: maskEmail(userData.email),
            maskedPhone: maskPhone(userData.phone || userData.phoneNumber || ''),
            email: userData.email, // needed for Firebase Auth sign-in only
        });

    } catch (err) {
        console.error('Find account error:', err);
        return Response.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}