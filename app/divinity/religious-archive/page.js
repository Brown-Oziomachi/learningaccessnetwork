import { Suspense } from "react";
import ReligiousArchiveClient from "./religious-archive";

export const metadata = {
    title: "LAN Divinity | Browse All Sacred Texts",
    description: "Browse the full LAN Divinity sacred texts archive.",
}

export default function ReligiousArchivePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            </div>
        }>
            <ReligiousArchiveClient />
        </Suspense>
    );
}