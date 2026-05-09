import { Suspense } from "react";
import SellerAccountClient from "./seller";

export const metadata = {
    title: "Seller Dashboard | LAN Library",
    description:
        "Welcome to the LAN Library Seller Dashboard — manage your uploaded books, track sales and earnings, monitor your performance, and grow your digital bookstore all in one place."
}

export default function SellerPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <SellerAccountClient />
        </Suspense>
    );
}
