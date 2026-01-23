
import { Suspense } from "react";
import SignInClient from "./Signin";

export default function SignUpPage() {
    return (
        <Suspense fallback={<SignInLoading />}>
            <SignInClient />
        </Suspense>
    );
}

function SignInLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading sign in page…</p>
        </div>
    );
}
