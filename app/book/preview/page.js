import BookPreviewPage from '@/components/PreviewComponent';
import React, { Suspense } from 'react';

export default function Page() {
    return (
        <div>
            <Suspense fallback={<div>Loading preview content...</div>}>
                <BookPreviewPage />
            </Suspense>
        </div>
    );
}
