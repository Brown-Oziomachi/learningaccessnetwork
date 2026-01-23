
import { Suspense } from "react";
import CreateAccountNameClient from "./CreateAccount";

export default function CreateAccountNamePage() {
    return (
        <Suspense fallback={<CreateAccountNameClientLoading />}>
            <CreateAccountNameClient />
        </Suspense>
    );
}

function CreateAccountNameClientLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading form…</p>
        </div>
    );
}
