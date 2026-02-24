'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';

export default function SignUpClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const ref = searchParams.get('referral_code'); // ✅ capture referral code

    // Build role-selection URL keeping both email and ref
    const roleSelectionUrl = `/auth/role-selection${email || ref
        ? `?${email ? `email=${email}` : ''}${email && ref ? '&' : ''}${ref ? `referral_code=${ref}` : ''}`
        : ''
        }`;

    return (
        <AuthLayout backPath="/auth/signin">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Join Learning Access Network
            </h1>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 mb-6">
                <div className="flex items-center justify-center gap-4">
                    <Globe className="w-16 h-16 text-blue-950" />
                    <div className="text-6xl">📚</div>
                    <div className="text-6xl">👍</div>
                </div>
            </div>

            <p className="text-gray-700 mb-8 leading-relaxed">
                Create an account to access thousands of PDF books, connect with
                learners, and build your digital library.
            </p>

            <div className="flex flex-col md:flex-row gap-5 max-md:w-full">
                <Link href={roleSelectionUrl} className="w-full md:w-auto">
                    <button className="w-full bg-blue-950 text-white py-3 px-5 rounded-full font-semibold hover:bg-blue-900 transition-colors">
                        Create new account
                    </button>
                </Link>

                <Link href="/auth/find-my-account" className="w-full md:w-auto">
                    <button className="w-full text-center bg-white text-blue-950 py-3 px-12 rounded-full border border-blue-950 font-semibold hover:bg-blue-950 hover:text-white transition-colors">
                        Find my account
                    </button>
                </Link>
            </div>
        </AuthLayout>
    );
}