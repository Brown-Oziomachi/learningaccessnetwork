import RequestPrintPermissionClient from "./requestprint";
import { Suspense } from "react";

export const metadata = {
    title: "Print Permission | The Global Student Library",
    description: "Request a print permission from the owner "
}

export default function RequestPrintPermissionPage() {

    return (
        <Suspense 
        fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
        }
        > 
            <RequestPrintPermissionClient  />
            </Suspense> 
    )
}