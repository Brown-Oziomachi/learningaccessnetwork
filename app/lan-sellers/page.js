// app/payment/page.jsx
import { Suspense } from "react";
import SellersClient from "./lansellers";

export const metadata = {
    title: "Explore LAN Sellers | The Global Student Library. ",
    description: "Become part of Africa's largest digital academic library."
}
export default function SellersPage () {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <SellersClient />
        </Suspense>
    );
}
