import { Suspense } from "react";
import MyAccountClient from "./account";

export default function MyAccountPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <MyAccountClient />
        </Suspense>
    );
}