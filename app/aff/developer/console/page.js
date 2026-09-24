
import { Suspense } from "react"
import AffiliateDeveloperSuiteClient from "./developer"

export const metadata = {
    title: "LAN Library Developer Suites | LAN Library",
    description: "Understand how to use LAN Library api end-point"
}
export default function AffiliateDeveloperSuitePage() {

    return (
        <Suspense 
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
                </div>
            }
        >
            <AffiliateDeveloperSuiteClient />
            </Suspense>
    )
}