import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const iso = (v) => (v?.toDate ? v.toDate().toISOString() : v ?? null);

export async function GET() {
    const snap = await adminDb
        .collection("promotions")
        .where("status", "in", ["active", "approved"])
        .get();

    const now = Date.now();
    const ads = snap.docs
        .map((d) => {
            const { clickLog, ...ad } = d.data();
            return {
                id: d.id, ...ad,
                expiryDate: iso(ad.expiryDate),
                startDate: iso(ad.startDate),
                createdAt: iso(ad.createdAt),
                updatedAt: iso(ad.updatedAt),
            };
        })
        .filter((ad) => !ad.expiryDate || new Date(ad.expiryDate).getTime() > now);

    return NextResponse.json(ads, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
}