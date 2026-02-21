

import { Suspense } from "react";
import SellerProfileClient from "@/components/SellerProfileClient";

export const metadata = {
    title: "Access Your Purchased Books in One Place | LAN Library",
    description: "Have access to all your books when you purchased them, download them again when you want."
}
export default function SellerProfilePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <SellerProfileClient />
        </Suspense>
    );
}
