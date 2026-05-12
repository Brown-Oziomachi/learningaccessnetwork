import { Suspense } from 'react';
import CountryClient from './CountryClient';

export const metadata = {
    title: "Select your country to continue with LAN Reg | LAN Library",
    description: "Choose your country from the list."
}

export default function CountryPage() {
    return (
        <Suspense fallback={<div>Working on it...</div>}>
            <CountryClient />
        </Suspense>
    );
}