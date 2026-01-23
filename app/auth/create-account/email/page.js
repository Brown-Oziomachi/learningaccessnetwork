import { Suspense } from "react";
import EmailClient from "./EmailClient";

export default function EmailPage() {
    return (
        <Suspense fallback={<EmailLoading />}>
            <EmailClient />
        </Suspense>
    );
}

function EmailLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading email…</p>
        </div>
    );
}
