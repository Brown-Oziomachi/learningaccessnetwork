import BookPreviewPage from '@/components/PreviewComponent';
import React, { Suspense } from 'react';

export default function Page() {
    return (
        <div>
            <h1>Book Preview</h1>
            <Suspense fallback={<div>Loading preview content...</div>}>
                <BookPreviewPage />
            </Suspense>
        </div>
    );
}
