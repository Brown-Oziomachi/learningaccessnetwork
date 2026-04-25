
import { Suspense } from "react";
import AboutClient from "../about";

export const metadata = {
    title: "About Us | LAN Library",
    description: "Discover everything about LAN Library ."
}

export default function AboutPage() {
    return (
        <Suspense fallback={<AboutUsLoading />}>
            <AboutClient />
        </Suspense>
    );
}

function AboutUsLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
