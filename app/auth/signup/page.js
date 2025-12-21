
import { Suspense } from "react";
import SignUpClient from "./Signup";

export default function SignUpPage() {
    return (
        <Suspense fallback={<SignUpLoading />}>
            <SignUpClient />
        </Suspense>
    );
}

function SignUpLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading sign up page…</p>
        </div>
    );
}
