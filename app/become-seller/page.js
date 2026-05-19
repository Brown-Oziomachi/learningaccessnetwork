// app/payment/page.jsx
import { Suspense } from "react";
import BecomeSellerClient from "./seller";

export const metadata = {
    title: "Become a Seller Following The Process | LAN Library",
    description: "Fill the form with your account details to become a verified seller in LAN "
};

export default function BecomeSellerPage() {
    return (
        <Suspense fallback={< BecomeSellerLoading />} >
            <BecomeSellerClient />
        </Suspense>
    );
}

function BecomeSellerLoading() {
    return (
        <div style={{ background: "#f5f0e8" }}
            className="min-h-screen flex items-center justify-center">
            <p className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950">Working on it</p>
        </div>
    )
}