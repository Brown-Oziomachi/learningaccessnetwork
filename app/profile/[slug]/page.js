import { Suspense } from "react";
import SellerProfileClient from "@/components/SellerProfileClient";

export const metadata = {
    title: "Profile | LAN Library",
    description: "Browse materials from this educator or seller on LAN Library.",
};

export default async function ProfileSlugPage({ params }) {
    const { slug } = await params;
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full" />
            </div>
        }>
            <SellerProfileClient sellerIdProp={slug} />
        </Suspense>
    );
}