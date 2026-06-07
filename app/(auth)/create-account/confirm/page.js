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
        <div style={{ background: "#f5f0e8" }} 
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
