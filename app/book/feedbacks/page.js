import { Suspense } from "react";
import BookFeedbacksClient from "./feedback";

export default function MyBooksPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            }
        >
            <BookFeedbacksClient />
        </Suspense>
    );
}
