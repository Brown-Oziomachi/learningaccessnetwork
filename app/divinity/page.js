import { Suspense } from "react";
import DivinityClient from "./home";

export const metadata = {
    title: "LAN Divinity | Theological Archive & Sacred Texts",
    description: "Africa's most comprehensive digital divinity archive.",
}

export default function DivinityPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            </div>
        }>
            <DivinityClient />
        </Suspense>
    );
}