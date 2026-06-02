import { Suspense } from "react";
import SellerNetworkClient from "./network";

export const metadata = {
    title: "Explore Seller Network | LAN Library",
    description: "Recharge your mobile credit and pay bills with ease! Join LAN Library and enjoy exclusive benefits together."
}
export default function SellerNetworkPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <SellerNetworkClient />
        </Suspense>
    );
}
