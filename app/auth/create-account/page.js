
import { Suspense } from "react";
import CreateAccountNameClient from "./CreateAccount";

export const metadata = {
    title: "Create Your Account by Providing Your Real Name and Surname | LAN Library",
    description: "Have access to all your books when you purchased them, download them again when you want."
}

export default function CreateAccountNamePage() {
    return (
        <Suspense fallback={<CreateAccountNameClientLoading />}>
            <CreateAccountNameClient />
        </Suspense>
    );
}

function CreateAccountNameClientLoading() {
    return (
        <div style={{ background: "#f5f0e8" }} 
            className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}
