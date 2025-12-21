
import { Suspense } from "react";
import PasswordClient from "./Password";

export default function PasswordPage() {
    return (
        <Suspense fallback={<PasswordLoading />}>
            <PasswordClient />
        </Suspense>
    );
}

function PasswordLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading password…</p>
        </div>
    );
}
