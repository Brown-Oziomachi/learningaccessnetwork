
import { Suspense } from "react";
import FindAccountClient from "./MyAccount";

export default function FindAccountPage() {
    return (
        <Suspense fallback={<FindAccountLoading />}>
            <FindAccountClient />
        </Suspense>
    );
}

function FindAccountLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading find account page…</p>
        </div>
    );
}
