import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";

export default function ConfirmPage() {
    return (
        <Suspense fallback={<ConfirmLoading />}>
            <ConfirmClient />
        </Suspense>
    );
}

function ConfirmLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading confirmation…</p>
        </div>
    );
}
