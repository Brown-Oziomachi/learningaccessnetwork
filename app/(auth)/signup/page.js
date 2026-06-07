
import { Suspense } from "react";
import SignUpClient from "./Signup";

export const metadata = {
    title: "Create Account To access Thousands of Documents | LAN Library",
    description: "Have access to all documents when you create with us."
}
export default function SignUpPage() {
    return (
        <Suspense fallback={<SignUpLoading />}>
            <SignUpClient />
        </Suspense>
    );
}

function SignUpLoading() {
    return (
        <div style={{ background: "#f5f0e8" }} 
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
