import { Suspense } from 'react';
import CountryClient from './CountryClient';

export const metadata = {
    title: "Select your country to continue with LAN Reg | LAN Library",
    description: "Choose your country from the list."
}

export default function CountryPage() {
    return (
        <Suspense fallback={< CountryLoading />}>
            <CountryClient />
        </Suspense>
    );
}

function CountryLoading() {
    return (
        <div style={{ background: "#f5f0e8" }}
            className="min-h-screen flex items-center justify-center">
            <p>Working on it</p>
        </div>
    )
}