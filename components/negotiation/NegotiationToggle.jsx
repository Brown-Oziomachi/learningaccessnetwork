"use client";
// Save as: components/negotiation/NegotiationToggle.jsx
// Lets a seller / faculty member switch negotiation on or off for a book they already uploaded.
// Use it inside the "My Books" page:  <NegotiationToggle book={book} />

import React, { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { GOLD, NAVY } from "./shared";

export default function NegotiationToggle({ book, onSaved }) {
    const price = Number(book?.price) || 0;
    const [on, setOn] = useState(book?.isNegotiable === true);
    const [pct, setPct] = useState(Number(book?.maxDiscountPercent) || 20);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    if (book?.isFree || price <= 0) return null;

    const save = async (nextOn, nextPct) => {
        setSaving(true);
        setMsg("");
        try {
            await updateDoc(doc(db, "advertMyBook", String(book.id).replace(/^firestore-/, "")), {
                isNegotiable: nextOn,
                maxDiscountPercent: nextOn ? nextPct : null,
                negotiationUpdatedAt: serverTimestamp(),
            });
            setOn(nextOn);
            setPct(nextPct);
            onSaved?.({ isNegotiable: nextOn, maxDiscountPercent: nextPct });
        } catch (e) {
            console.error(e);
            setMsg("Could not save. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ border: "0.5px solid #e5ddd0", background: "#fff", padding: "10px 12px", fontFamily: "'Lato',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                    {book?.intent === "academic" ? "Student discounts" : "Negotiation"}
                </span>
                <button type="button" disabled={saving} onClick={() => save(!on, pct)}
                    aria-pressed={on}
                    style={{ width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: on ? "#16a34a" : "#d1d5db", position: "relative", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                </button>
            </div>
            {on && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#888" }}>Max discount:</span>
                    {[10, 20, 30, 40].map((p) => (
                        <button key={p} type="button" disabled={saving} onClick={() => save(true, p)}
                            style={{ padding: "4px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${pct === p ? NAVY : "#e5ddd0"}`, background: pct === p ? NAVY : "#fff", color: pct === p ? "#fff" : NAVY }}>
                            {p}%
                        </button>
                    ))}
                </div>
            )}
            {msg && <p style={{ fontSize: 11, color: GOLD, margin: "6px 0 0" }}>{msg}</p>}
        </div>
    );
}