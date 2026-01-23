import { Suspense } from "react";
import TermsOfServiceClient from "./terms";

export const metadata = {
  title: "Terms Of Service | LAN Library",
  description: "Learn and understand LAN privacy policies and how we use your data and also protect your information"
}

export default function TermsOfServicePage() {
  return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <TermsOfServiceClient />
        </Suspense>
    );
}