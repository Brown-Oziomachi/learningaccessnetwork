
import { Suspense } from "react";
import FindAccountClient from "./MyAccount";

export const metadata = {
    title: "Find Your Account | LAN Library",
    description: "Have access to all your books when you purchased them, download them again when you want."
}

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
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
