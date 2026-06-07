import { Suspense } from "react";
import SellerSlugClient from "./slug";

export const metadata = {
    title: "Explore Seller CONTENT MAP Africa-wide | LAN Library",
    description: "Recharge your mobile credit and pay bills with ease! Join LAN Library and enjoy exclusive benefits together."
}
export default function SellerSlugPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            < SellerSlugClient />
        </Suspense>
    );
}
