import { Suspense } from "react";
import SupportClient from "./support";

export const metadata = {
    title: "Support | LAN Library",
    description: "Get help with your LAN Library account. Browse our FAQ, track your support tickets, and contact our team.",
};

export default function SupportPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <SupportClient />
        </Suspense>
    );
}