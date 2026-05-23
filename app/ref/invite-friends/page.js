import { Suspense } from "react";
import ReferralClient from "./referral";

export const metadata = {
    title: "Referral | LAN Library",
    description: "Invite friends to join LAN Library and earn rewards! Share your unique referral link and enjoy exclusive benefits together."
}
export default function ReferralPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <ReferralClient />
        </Suspense>
    );
}
