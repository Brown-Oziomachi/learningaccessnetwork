import { Suspense } from 'react';
import PayPalCheckoutClient from './PayPalCheckoutPage';

export default function Page() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #0d1f35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#6b7280' }}>Loading checkout...</p>
                </div>
            </div>
        }>
            <PayPalCheckoutClient />
        </Suspense>
    );
}