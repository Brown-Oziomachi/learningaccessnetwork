import { Suspense } from "react";
import TransferClient from "./transfer";

export const metadata = {
    title: "Transfer | LAN Library",
    description: "Easily transfer your books to another account with our secure transfer service. Keep your library accessible and organized."}
export default function TransferPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <TransferClient />
        </Suspense>
    );
}
