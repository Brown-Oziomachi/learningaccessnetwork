// app/payment/page.jsx
import { Suspense } from "react";
import InstitutionalLibraryClient from "./browse";

export const metadata = {
    title: "Browse Different Institutional Documents | LAN Library ",
    description: "Discover a place of knowledge, where access to information becomes easy",
};

export default function InstitutionalLibraryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <InstitutionalLibraryClient />
        </Suspense>
    );
}
