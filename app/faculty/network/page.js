import { Suspense } from "react";
import FacultyNetworkClient from "./faculty";

export const metadata = {
    title: "Explore Faculty Network | LAN Library",
    description: "Recharge your mobile credit and pay bills with ease! Join LAN Library and enjoy exclusive benefits together."
}
export default function FacultyNetworkPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <FacultyNetworkClient />
        </Suspense>
    );
}
