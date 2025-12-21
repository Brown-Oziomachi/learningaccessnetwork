import { Suspense } from "react";
import DOBClient from "./Dob";

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
