import { Suspense } from "react";
import LANDocsClient from "./lan";


export const metadata = {
    title: "Documentation | LAN Library",
    description: "Read and understand LAN Library platform."
}

export default function LANDocsPage() {
    return (
        <Suspense
            fallback={< LANDocLoading />}>
            <LANDocsClient />
        </Suspense>
    );
}

function LANDocLoading() {
    return (
        <div style={{ background: "#f5f0e8" }}
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
};
