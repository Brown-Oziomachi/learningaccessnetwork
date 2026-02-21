
import { Suspense } from "react";
import SignInClient from "./Signin";

export const metadata = {
    title: "Sign in to LAN Library | LAN Library",
    description: "Have access to all documents by signing in to your account."
}

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
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
