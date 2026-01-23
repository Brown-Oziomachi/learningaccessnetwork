// app/payment/page.jsx
import { Suspense } from "react";
import BestsellersClient from "./bestsellers";

export const metadata = {
    title: "Best Sellers in LAN Lib | LAN Libs",
    description: "Welcome the best sellers porter, where the worlds sees the most recognizes writers in LAN Libs"
};

export default function BestsellersPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <BestsellersClient />
        </Suspense>
    );
}
