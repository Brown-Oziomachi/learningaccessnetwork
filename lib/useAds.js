// lib/useAds.js
import { useState, useEffect } from "react";
import { fetchActiveAds } from "./adsCache";

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function resolveImageUrl(raw) {
    if (!raw) return "";
    try {
        const parsed = new URL(raw);
        if (parsed.hostname.includes("google.") && parsed.pathname === "/imgres") {
            const direct = parsed.searchParams.get("imgurl");
            if (direct) return decodeURIComponent(direct);
        }
    } catch { }
    return raw;
}

/**
 * Returns ads shaped exactly like book objects so they
 * can be dropped into any book array without special casing.
 */
export function useAds(tier = "Gold", max = 4) {
    const [ads, setAds] = useState([]);

    useEffect(() => {
        fetchActiveAds()
            .then((all) => {
                const filtered = shuffle(all.filter((a) => a.tier === tier)).slice(0, max);
                const shaped = filtered.map((ad) => ({
                    // identity
                    id: `ad-${ad.id}`,
                    adId: ad.id,
                    isAd: true,
                    adTier: tier,
                    // book-shaped fields
                    title: ad.bookTitle || ad.headline || "Sponsored",
                    author: ad.bookAuthor || "",
                    category: ad.resourceType || ad.category || "",
                    price: ad.price ? Number(ad.price) : null,
                    image: resolveImageUrl(ad.bannerUrl) ||
                        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
                    adLink: ad.link || (ad.bookId ? `/book/preview?id=${ad.bookId}` : "#"),
                    // ── ADD THESE THREE ──
                    headline: ad.headline || ad.bookTitle || "",
                    ctaText: ad.ctaText || "Learn More",
                    bannerUrl: resolveImageUrl(ad.bannerUrl) || "",
                    // passthrough for click tracking
                    _raw: ad,
                }));
                setAds(shaped);
            })
            .catch(() => { });
    }, [tier, max]);

    return ads;
}

/**
 * Injects ad cards into a flat book array every `every` positions.
 * e.g. injectAds(books, ads, 5) → book book book book book AD book book ...
 */
// lib/useAds.js

export function injectAds(books, primaryAds, primaryEvery = 5, secondaryAds = [], secondaryEvery = 5) {
    if (!primaryAds.length && !secondaryAds.length) return books;
    const result = [];
    let primaryIdx = 0;
    let secondaryIdx = 0;
    books.forEach((book, i) => {
        result.push(book);
        const pos = i + 1;
        if (pos % primaryEvery === 0 && primaryIdx < primaryAds.length) {
            result.push(primaryAds[primaryIdx++]);
        } else if (pos % secondaryEvery === 0 && secondaryIdx < secondaryAds.length) {
            result.push(secondaryAds[secondaryIdx++]);
        }
    });
    return result;
}
