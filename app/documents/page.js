// app/payment/page.jsx
import { Suspense } from "react";
import AllBooksClient from "./documents";

export const metadata = {
    title: "LAN Library | Browse varities of documents uploaded by LAN sellers ",
    description: "Become part of Africa's largest digital academic library, where education resources is documented for students to have access to all knowledge through network system. Have access to all university library from your country."
}

export default function AllBooksPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <AllBooksClient />
        </Suspense>
    );
}
