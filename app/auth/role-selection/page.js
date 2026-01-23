'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { GraduationCap, Store, Building2 } from 'lucide-react';

export default function RoleSelectionClient() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('');

    const handleContinue = () => {
        if (!selectedRole) return;

        // Store role in sessionStorage to pass through the flow
        sessionStorage.setItem('userRole', selectedRole);

        // If university, redirect to CREATE ACCOUNT with accountType parameter
        if (selectedRole === 'university') {
            router.push('/auth/create-account?accountType=university');
        } else {
            // For student/seller, go to create account
            router.push('/auth/create-account');
        }
    };
    
    return (
        <AuthLayout>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Join as a Student, Seller, or Institution
            </h1>
            <p className="text-gray-600 mb-8">
                Choose how you want to use the platform
            </p>
            <div className="space-y-4 mb-8">
                {/* Student Option */}
                <button
                    // onClick={() => setSelectedRole('student')}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${selectedRole === 'student'
                            ? 'border-blue-950 bg-blue-50 '
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'student' ? 'bg-blue-950' : 'bg-gray-100'
                            }`}>
                            <GraduationCap className={`w-6 h-6 ${selectedRole === 'student' ? 'text-white' : 'text-gray-600'
                                }`} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                I'm a Student
                            </h3>
                            <p className="text-sm text-gray-600">
                                Buy PDF books, access learning materials, and manage your library.
                            </p>
                            <p className="text-sm text-gray-600">
                                Coming soon
                            </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === 'student'
                                ? 'border-blue-950 bg-blue-950'
                                : 'border-gray-300'
                            }`}>
                            {selectedRole === 'student' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </div>
                    </div>
                </button>

                {/* Seller Option */}
                <button
                    onClick={() => setSelectedRole('seller')}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${selectedRole === 'seller'
                            ? 'border-blue-950 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'seller' ? 'bg-blue-950' : 'bg-gray-100'
                            }`}>
                            <Store className={`w-6 h-6 ${selectedRole === 'seller' ? 'text-white' : 'text-gray-600'
                                }`} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                I'm a Seller
                            </h3>
                            <p className="text-sm text-gray-600">
                                Sell PDF books, manage inventory, and track your sales
                            </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === 'seller'
                                ? 'border-blue-950 bg-blue-950'
                                : 'border-gray-300'
                            }`}>
                            {selectedRole === 'seller' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </div>
                    </div>
                </button>

                {/* University/School Option - NEW */}
                <button
                    // onClick={() => setSelectedRole('university')}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${selectedRole === 'university'
                            ? 'border-blue-950 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${selectedRole === 'university' ? 'bg-blue-950' : 'bg-gray-100'
                            }`}>
                            <Building2 className={`w-6 h-6 ${selectedRole === 'university' ? 'text-white' : 'text-gray-600'
                                }`} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Register University/School
                            </h3>
                            <p className="text-sm text-gray-600">
                                Register your institution, upload materials, and manage your academic library.
                            </p>
                            <p className="text-sm text-gray-600">
                                Coming soon
                            </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === 'university'
                                ? 'border-blue-950 bg-blue-950'
                                : 'border-gray-300'
                            }`}>
                            {selectedRole === 'university' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </div>
                    </div>
                </button>
            </div>

            <button
                onClick={handleContinue}
                disabled={!selectedRole}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue
            </button>
        </AuthLayout>
    );
}