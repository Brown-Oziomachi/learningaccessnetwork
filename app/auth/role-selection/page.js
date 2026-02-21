
import { Suspense } from "react";
import RoleSelectionClient from "./role";

export const metadata = {
    title: "Select How You Want to Use LAN Library | LAN Library",
    description: "Have access to all your books when you purchased them, download them again when you want."
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<SignInLoading />}>
            <RoleSelectionClient />
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
