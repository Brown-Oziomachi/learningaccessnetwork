import { Suspense } from "react";
import VerifyFacultyClient from "./faculty";

export default function VerifyFacultyPage() {
    return (
        <Suspense fallback={<FacultyLoading />}>
            <VerifyFacultyClient />
        </Suspense>
    );
}

function FacultyLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Working on it</p>
        </div>
    );
}