import { Suspense } from "react";
import DOBClient from "./Dob";

export const metadata = {
    title: "Create Your Account by Providing Your DOB | LAN Library",
    description: "Have access to all your books when you purchased them, download them again when you want."
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<DobLoading />}>
            <DOBClient />
        </Suspense>
    );
}

function DobLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading date of birth…</p>
        </div>
    );
}
