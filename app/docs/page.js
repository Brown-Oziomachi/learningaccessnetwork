import { Suspense } from "react";
import LANDocsClient from "./lan";


export const metadata = {
    title: "LAN Library | Documentation",
    description: "Read and understand LAN Library platform."
}

export default function LANDocsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <LANDocsClient />
        </Suspense>
    );
}
