import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AiChatContentClient from "./chat";

export default function AiChatPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <Loader2 className="animate-spin text-sky-400" size={32} />
            </div>
        }>
            <AiChatContentClient />
        </Suspense>
    );
}