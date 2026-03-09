import { Suspense } from 'react';
import CountryClient from './CountryClient';

export default function CountryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CountryClient />
        </Suspense>
    );
}