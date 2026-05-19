// app/payment/page.jsx
import { Suspense } from "react";
import BuyPhysicalClient from "./physical";

export const metadata = {
    title: "Purchase Physical Book | LAN Library ",
    description: "Become part of Africa's largest digital academic library, where education resources is documented for students to have access to all knowledge through network system. Have access to all university library from your country."
}
export default function BuyPhysicalPage () {
    return (
        <Suspense
            fallback={< BuyPhysicalLoading />}>
            <BuyPhysicalClient />
        </Suspense>
    );
}

function BuyPhysicalLoading() {
    return (
        <div style={{ background: "#f5f0e8" }}
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}