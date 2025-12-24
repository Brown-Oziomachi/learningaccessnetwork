import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function GoogleSignInButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check account status
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const accountStatus = userData.accountStatus || 'active';

                if (accountStatus === 'suspended') {
                    await auth.signOut();
                    alert('Your account has been suspended. Please contact support at support@lanlibrary.com');
                    setLoading(false);
                    return;
                }

                if (accountStatus === 'pending') {
                    await auth.signOut();
                    alert('Your account is under review. Please contact support at support@lanlibrary.com');
                    setLoading(false);
                    return;
                }
            } else {
                // Create user document if it doesn't exist
                await setDoc(userDocRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    accountStatus: 'active',
                    createdAt: new Date(),
                    role: 'user'
                });
            }

            router.push('/home');
        } catch (error) {
            console.error('Google sign in error:', error);
            alert('Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
            {/* Google icon SVG */}
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
    );
}