// This is the route entry point — keep it simple
import { Suspense } from "react";
import DivinityCategoryClient from "./DivinityCategoryPage";

export const metadata = {
    title: "LAN Divinity | Sacred Texts",
    description: "Browse theological texts by tradition.",
}

export default function CategoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            </div>
        }>
            <DivinityCategoryClient />
        </Suspense>
    );
}