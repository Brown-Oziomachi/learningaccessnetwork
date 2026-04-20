import { Suspense } from "react";
import AdvertiseClient from "./advertise";

export const metadata = {
    title: 'Upload Your Documents and Start Marking Money | LAN Library',
    description: 'Make LAN Library Your Porter of Making Money.',
};

export default function AdvertisePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <AdvertiseClient />
        </Suspense>
    );
}