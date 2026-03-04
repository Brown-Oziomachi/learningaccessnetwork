

import { Suspense } from "react";
import ContactClient from "@/app/contact/contact";

export const metadata = {
    title: "LAN Library | Contact Us",
    description: "Have access to all documents by signing in to your account."
}

export default function ContactPage() {
    return (
        <Suspense fallback={<ContactLoading />}>
            <ContactClient />
        </Suspense>
    );
}

function ContactLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
