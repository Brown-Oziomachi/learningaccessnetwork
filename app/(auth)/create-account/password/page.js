
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
        <div style={{ background: "#f5f0e8" }} 
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
