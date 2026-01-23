// app/payment/page.jsx
import { Suspense } from "react";
import FAQClient from "./faqs";

export default function faqsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <FAQClient />
        </Suspense>
    );
}
