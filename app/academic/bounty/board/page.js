// app/bounty/page.jsx
import { Suspense } from "react";
import PublishFlowWithBountyClient from "./board";

export const metadata = {
    title: "Academic Bounty Board | LAN Library — Campus Economy Hub",
    description: "Can't find a file? Post a paid academic request and let top campus sellers from across Africa create it for you. Browse open bounties, submit proposals, and earn rewards.",
};

export default function PublishFlowWithBountyPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f1ea" }}>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: 48, height: 48,
                                border: "3px solid #e5ddd0",
                                borderTopColor: "#b8963e",
                                borderRadius: "50%",
                                animation: "spin 0.7s linear infinite",
                                margin: "0 auto 16px",
                            }}
                        />
                        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#b8963e" }}>
                            Loading Bounties…
                        </p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            }
        >
            <PublishFlowWithBountyClient />
        </Suspense>
    );
}