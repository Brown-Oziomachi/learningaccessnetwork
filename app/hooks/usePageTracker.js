"use client";
// ─────────────────────────────────────────────────────────────
//  usePageTracker.js
//  Drop this hook inside your root layout.js (or any Client
//  Component that wraps every page).
//
//  Usage in layout.js:
//    import PageTracker from '@/hooks/usePageTracker';
//    export default function RootLayout({ children }) {
//      return <html><body><PageTracker />{children}</body></html>;
//    }
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebaseConfig"; // adjust path if needed
import {
    doc,
    setDoc,
    increment,
    serverTimestamp,
} from "firebase/firestore";

// ── helpers ──────────────────────────────────────────────────

/** Turn a pathname into a safe Firestore document ID.
 *  "/books/engineering-materials" → "books_engineering-materials"
 */
function pathToDocId(pathname) {
    return pathname
        .replace(/^\/+/, "")   // strip leading slash
        .replace(/\//g, "_")   // / → _
        .replace(/[.#$[\]]/g, "-") // escape Firestore-forbidden chars
        || "home";
}

/** Returns a stable anonymous visitor ID stored in sessionStorage.
 *  Resets each browser session → unique-per-session counting. */
function getVisitorId() {
    try {
        const key = "__lan_vid";
        let id = sessionStorage.getItem(key);
        if (!id) {
            id = Math.random().toString(36).slice(2) + Date.now().toString(36);
            sessionStorage.setItem(key, id);
        }
        return id;
    } catch {
        return "unknown";
    }
}

/** Merge-writes a view hit to Firestore with debounce protection.
 *  Only fires after the user has been on the page for `dwellMs`
 *  milliseconds (default 5 s) so accidental fast clicks don't count. */
async function recordView(pathname) {
    const docId = pathToDocId(pathname);
    const visitorId = getVisitorId();
    const visitorDocId = `${docId}__${visitorId}`;

    // ── 1. Always increment total views ──────────────────────
    const statsRef = doc(db, "page_stats", docId);
    await setDoc(
        statsRef,
        {
            path: pathname,
            totalViews: increment(1),
            lastSeenAt: serverTimestamp(),
        },
        { merge: true }
    );

    // ── 2. Unique visitor (session-scoped) ───────────────────
    // We use a sub-collection to track which visitor IDs we've
    // already seen for this page in this session.
    const visitorRef = doc(db, "page_stats_visitors", visitorDocId);
    const { getDoc } = await import("firebase/firestore");
    const existing = await getDoc(visitorRef);

    if (!existing.exists()) {
        // First time this visitor hit this page this session
        await setDoc(visitorRef, {
            path: pathname,
            visitorId,
            seenAt: serverTimestamp(),
        });
        // Increment uniqueVisitors on the parent doc
        await setDoc(
            statsRef,
            { uniqueVisitors: increment(1) },
            { merge: true }
        );
    }
}

// ── Component ────────────────────────────────────────────────

/**
 * Invisible component — renders nothing, just tracks page views.
 * Mount it once in your root layout.
 */
export default function PageTracker({ dwellMs = 5000 }) {
    const pathname = usePathname();
    const timerRef = useRef(null);
    const lastTrackedRef = useRef(null);

    useEffect(() => {
        // Don't double-track the same path
        if (pathname === lastTrackedRef.current) return;

        // Clear any pending timer from a previous fast navigation
        if (timerRef.current) clearTimeout(timerRef.current);

        // Only count the view if the user stays for dwellMs
        timerRef.current = setTimeout(async () => {
            try {
                await recordView(pathname);
                lastTrackedRef.current = pathname;
            } catch (err) {
                // Non-fatal — analytics failures should never break the app
                console.warn("[PageTracker] Failed to record view:", err.message);
            }
        }, dwellMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname, dwellMs]);

    return null; // renders nothing
}