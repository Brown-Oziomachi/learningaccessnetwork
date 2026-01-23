// app/payment/page.jsx
import { Suspense } from "react";
import HomeClient from "./home";

export const metadata = {
    title: "LAN Library | Join LAN Library as a verified educational institution |",
    description: "Become part of Africa's largest digital academic library, where education resources is documented for students to have access to all knowledge through network system. Have access to all university library from your country."
}
export default function HomePage () {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <HomeClient />
        </Suspense>
    );
}
