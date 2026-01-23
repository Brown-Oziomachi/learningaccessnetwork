import BookPreviewPage from '@/components/PreviewComponent';
import React, { Suspense } from 'react';

export const metadata = {
    title: "Preview Your Book Before Purchasing | LAN Library Preview page",
    description: "Where books are previewed with description, before proceeding to payment gateway"
}
export default function Page() {
    return (
        <div>
            <Suspense fallback={<div>Loading preview content...</div>}>
                <BookPreviewPage />
            </Suspense>
        </div>
    );
}
