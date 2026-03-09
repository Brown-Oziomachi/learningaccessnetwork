'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';

const countries = [
    "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Australia",
    "Austria", "Bangladesh", "Belgium", "Benin", "Bolivia", "Botswana",
    "Brazil", "Burkina Faso", "Burundi", "Cameroon", "Canada", "Chad",
    "Chile", "China", "Colombia", "Congo", "Côte d'Ivoire", "Denmark",
    "DR Congo", "Ecuador", "Egypt", "Ethiopia", "Finland", "France",
    "Gabon", "Gambia", "Germany", "Ghana", "Guinea", "India", "Indonesia",
    "Iran", "Iraq", "Ireland", "Italy", "Jamaica", "Japan", "Jordan",
    "Kenya", "Liberia", "Libya", "Madagascar", "Malawi", "Malaysia",
    "Mali", "Mauritania", "Mauritius", "Mexico", "Morocco", "Mozambique",
    "Namibia", "Netherlands", "New Zealand", "Niger", "Nigeria", "Norway",
    "Pakistan", "Philippines", "Poland", "Portugal", "Rwanda", "Senegal",
    "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Spain",
    "Sudan", "Sweden", "Switzerland", "Tanzania", "Togo", "Tunisia",
    "Uganda", "United Kingdom", "United States", "Zambia", "Zimbabwe"
];

export default function CountryClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [country, setCountry] = useState('');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            accountType: searchParams.get('accountType') || '',
        });
    }, [searchParams]);

    const filtered = countries.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    const handleNext = () => {
        if (!country) {
            setError('Please select your country');
            return;
        }

        const ref = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';

        const params = new URLSearchParams({
            ...formData,
            country, // ✅ country added here
        });

        if (ref) params.append('referral_code', ref); // ✅ fixed from 'ref' to 'referral_code'

        router.push(`/auth/create-account/email?${params.toString()}`);
    };

    return (
        <AuthLayout
            backPath={`/auth/create-account/dob?${new URLSearchParams(formData).toString()}`}
            showFindAccount={true}
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Where are you from?
            </h1>
            <p className="text-gray-600 mb-6">
                Select the country you currently live in.
            </p>

            {/* Search */}
            <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 text-gray-900 mb-3"
            />

            {/* Country List */}
            <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                {filtered.map((c) => (
                    <button
                        key={c}
                        onClick={() => {
                            setCountry(c);
                            setError('');
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${country === c
                                ? 'bg-blue-950 text-white font-semibold'
                                : 'text-gray-800 hover:bg-blue-50'
                            }`}
                    >
                        {c}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No country found</p>
                )}
            </div>

            {/* Selected */}
            {country && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-blue-950 font-semibold">Selected: {country}</p>
                </div>
            )}

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
                onClick={handleNext}
                disabled={!country}
                className="max-md:w-full lg:w-1/4 mx-auto bg-blue-950 text-white py-3 rounded-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </AuthLayout>
    );
}