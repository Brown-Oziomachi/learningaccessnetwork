'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { handleEmailPasswordSignIn } from '@/lib/auth/authHelpers';
import { useAuth } from '@/hooks/useAuth';

export default function SignInClient() {
    const router = useRouter();
    const { loading: authLoading } = useAuth(true);
    const [loading, setLoading] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await handleEmailPasswordSignIn(loginData.email, loginData.password);

        if (result.success) {
            router.push('/home');
        } else {
            const error = result.error;
            switch (error.code) {
                case 'auth/user-not-found':
                    alert('No account found with this email. Create a new account?');
                    router.push(`/auth/signup?email=${encodeURIComponent(loginData.email)}`);
                    break;
                case 'auth/wrong-password':
                    alert('Incorrect password. Try again or reset your password.');
                    break;
                case 'auth/invalid-email':
                    alert('Invalid email address.');
                    break;
                default:
                    alert('Failed to sign in. Please try again later.');
            }
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <AuthLayout showBack={false} showLanguageSelector={true}>
            <div className="flex-1 flex flex-col items-center justify-start pt-8">
                <div className="mb-8">
                    <div className="w-24 h-24 bg-white border-4 border-blue-950 rounded-full flex items-center justify-center">
                        <Globe className="w-12 h-12 text-blue-950" />
                    </div>
                </div>

                <div className="w-full max-w-md mb-8">
                    <GoogleSignInButton />
                </div>

                <div className="w-full max-w-md mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">OR</span>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md space-y-4 mb-6">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="w-full px-4 py-4 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-950"
                    />
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full max-w-md bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors mb-4 disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : 'Log in'}
                </button>

                <Link href="/auth/forgot-password">
                    <button className="text-blue-950 hover:underline mb-12">
                        Forgotten password?
                    </button>
                </Link>

                <div className="flex-1"></div>

                <Link href="/auth/signup" className="w-full max-w-md">
                    <button className="w-full bg-white border-2 border-blue-950 text-blue-950 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors mb-4">
                        Create new account
                    </button>
                </Link>

                <div className="mb-8 text-gray-500 text-sm">
                    <span className="font-bold">Learning Access Network</span>
                </div>
            </div>
        </AuthLayout>
    );
}
