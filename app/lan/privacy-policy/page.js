import { Suspense } from "react";
import PrivacyPolicyClient from "./privacy";

export const metadata = {
  title: "Privacy Policies | LAN Library",
  description: "Learn and understand LAN privacy policies and how we use your data and also protect your information"
}

export default function PrivacyPolicyPage() {
  return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <PrivacyPolicyClient />
        </Suspense>
    );
}