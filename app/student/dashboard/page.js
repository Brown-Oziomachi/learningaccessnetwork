import { Suspense } from "react";
import StudentDashboardClient from "./student";

export const metadata = {
    title: "Student Dashboard | LAN Library",
    description:
        "Welcome to the LAN Library Student Dashboard — your personal learning space where you can access purchased books, manage your library, track your learning materials, and download your books anytime."
}
export default function StudentDashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <StudentDashboardClient />
        </Suspense>
    );
}
