import { Suspense } from "react";
import SellerAdCreatorClient from "./ads";
// Rename this to match your new ad tracking/promotion client component

export const metadata = {
    title: "Boost Visibility | LAN Library",
    description:
        "Maximize your reach on the LAN Library. Create premium ad campaigns, track your promotion performance with real-time analytics, and get your publications in front of more students."
}

export default function SellerAdCreatorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
                </div>
            }
        >
            <SellerAdCreatorClient />
        </Suspense>
    );
}