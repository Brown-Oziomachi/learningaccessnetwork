"use client";

import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, query, getDocs, doc, getDoc, updateDoc,
    addDoc, runTransaction, serverTimestamp, increment,
    orderBy, where, limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

/* ── OWNER CONFIG ─────────────────────────────────────────────────── */
const OWNER_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
const LAN_PLATFORM_UID = "LAN_LIBRARY_PLATFORM";
const TRANSFER_FEE = 50;

/* ── COLOUR TOKENS ───────────────────────────────────────────────── */
const NAVY = "#0d2244";
const NAVYL = "#162a52";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#0b1628";
const CARD = "#111d33";
const CARD2 = "#162033";
const BORDER = "rgba(184,150,62,0.15)";

/* ── HELPERS ─────────────────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;
const fmtAcct = (a) => {
    if (!a) return "—";
    const num = a.replace("LAN", "");
    return `LAN-${num.slice(0, 3)}-${num.slice(3)}`;
};
const initials = (name) =>
    (name || "??").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const pill = (label, color = GOLD) => (
    <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        background: `${color}18`, color, border: `0.5px solid ${color}40`,
        padding: "2px 8px", borderRadius: 20,
    }}>{label}</span>
);

/* ── GLOBAL STYLES ───────────────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${BG}; font-family: 'Lato', sans-serif; color: #e2e8f0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.5 } }
  .fade { animation: fadeUp 0.35s cubic-bezier(.4,0,.2,1) both; }
  .spin { animation: spin 0.8s linear infinite; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px ${CARD2} inset; -webkit-text-fill-color: #e2e8f0; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${GOLD}40; border-radius: 4px; }
  .bank-input {
    width:100%; background: ${CARD}; border: 0.5px solid ${BORDER};
    border-radius: 8px; padding: 11px 14px; color: #e2e8f0;
    font-size: 13px; font-family: 'Lato', sans-serif; outline: none;
    transition: border-color 0.2s;
  }
  .bank-input:focus { border-color: ${GOLD}; }
  .bank-input::placeholder { color: #4a5a72; }
  .sel-row { display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; border-radius:8px; transition: background 0.15s; }
  .sel-row:hover { background: rgba(184,150,62,0.06); }
  .sel-row.active { background: rgba(184,150,62,0.10); border:0.5px solid ${BORDER}; }
  .nav-btn { display:flex; align-items:center; gap:8px; padding:9px 16px; border-radius:8px; border:none; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; transition: all 0.15s; letter-spacing:0.04em; }
  .nav-btn.active { background:rgba(184,150,62,0.15); color:${GOLDD}; }
  .nav-btn:not(.active) { background:none; color:#64748b; }
  .nav-btn:not(.active):hover { color:#94a3b8; background:rgba(255,255,255,0.04); }
  .action-btn { width:100%; padding:12px; border:none; border-radius:8px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.06em; transition: all 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .action-btn.gold { background:${GOLD}; color:${NAVY}; }
  .action-btn.gold:hover { background:${GOLDD}; }
  .action-btn.navy { background:${NAVY}; color:#fff; border:0.5px solid ${BORDER}; }
  .action-btn.navy:hover { background:${NAVYL}; }
  .action-btn.danger { background:rgba(239,68,68,0.12); color:#f87171; border:0.5px solid rgba(239,68,68,0.25); }
  .action-btn.danger:hover { background:rgba(239,68,68,0.2); }
  .action-btn:disabled { opacity:0.45; cursor:not-allowed; }
`;

/* ── LOGIN SCREEN ─────────────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const handle = async () => {
        if (!email || !pass) { setErr("Email and password are required"); return; }
        setLoading(true); setErr("");
        try {
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            if (!OWNER_EMAILS.includes(cred.user.email)) {
                await auth.signOut(); setErr("Access denied. Owner credentials required.");
            } else { onLogin(cred.user); }
        } catch (e) { setErr("Invalid credentials. Try again."); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <style>{G}</style>
            <div style={{ width: "100%", maxWidth: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div style={{ width: 64, height: 64, border: `1px solid ${BORDER}`, background: `${GOLD}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={GOLD} strokeWidth="1.5" />
                            <path d="M9 22V12h6v10" stroke={GOLD} strokeWidth="1.5" />
                        </svg>
                    </div>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Private Banking</p>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>LAN <em style={{ color: GOLD, fontStyle: "italic" }}>Bank</em></h1>
                    <p style={{ fontSize: 12, color: "#4a5a72", marginTop: 8, fontWeight: 300 }}>Owner Access Only</p>
                </div>

                <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: 28 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Email Address</label>
                        <input className="bank-input" type="email" placeholder="owner@lanlibrary.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Password</label>
                        <input className="bank-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
                    </div>
                    {err && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#f87171" }}>{err}</div>
                    )}
                    <button className="action-btn gold" onClick={handle} disabled={loading}>
                        {loading ? <div className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(13,34,68,0.3)", borderTopColor: NAVY, borderRadius: "50%" }} /> : null}
                        {loading ? "Authenticating…" : "Access LAN Bank →"}
                    </button>
                </div>

                <p style={{ textAlign: "center", fontSize: 11, color: "#2a3a52", marginTop: 20 }}>
                    Secured · Encrypted · Private
                </p>
            </div>
        </div>
    );
}

/* ── TRANSFER MODAL ───────────────────────────────────────────────── */
function TransferModal({ seller, allSellers, mode, onClose, onDone, adminUser }) {
    // mode: "wallet" | "bank" | "withdraw"
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [sending, setSending] = useState(false);
    const [err, setErr] = useState("");
    const [done, setDone] = useState(false);

    // Bank transfer specific
    const [bankName, setBankName] = useState(seller?.bankDetails?.bankName || "");
    const [accountNumber, setAccountNumber] = useState(seller?.bankDetails?.accountNumber || "");
    const [accountName, setAccountName] = useState(seller?.bankDetails?.accountName || "");
    const [bankCode, setBankCode] = useState(seller?.bankDetails?.bankCode || "");

    const isWithdraw = mode === "withdraw";
    const isBank = mode === "bank";
    const isWallet = mode === "wallet";

    const filtered = allSellers.filter(s =>
        s.id !== seller?.id &&
        (s.sellerName?.toLowerCase().includes(search.toLowerCase()) ||
            s.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
            s.bankDetails?.accountName?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleExecute = async () => {
        const amt = Number(amount);
        if (!amt || amt < 100) { setErr("Minimum ₦100"); return; }
        if (!reason.trim()) { setErr("Reason is required"); return; }
        setSending(true); setErr("");

        try {
            const token = await auth.currentUser?.getIdToken(true);

            if (isWithdraw) {
                const res = await fetch("/api/lan-bank/transfer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ mode: "debit", sellerId: seller.id, amount: amt, reason }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

            } else if (isWallet) {
                if (!selected) { setErr("Select a recipient"); return; }
                const res = await fetch("/api/lan-bank/transfer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ mode: "credit", sellerId: seller.id, targetId: selected.id, amount: amt, reason }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

            } else if (isBank) {
                const res = await fetch("/api/lan-bank/bank-transfer", {  
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        sellerId: seller?.id || "admin",
                        amount: amt,
                        narration: reason,
                        recipientBank: { bankCode, accountNumber, accountName, bankName },
                    }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || "Bank transfer failed");
            }

            setDone(true);
            onDone?.();
        } catch (e) { setErr(e.message); }
        finally { setSending(false); }
    };

    const modalBase = {
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16,
    };
    const box = {
        background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 16,
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
    };

    const title = isWithdraw ? "Debit Wallet" : isWallet ? "Credit Wallet" : "Bank Transfer";
    const titleColor = isWithdraw ? "#f87171" : isWallet ? "#34d399" : "#60a5fa";

    if (done) return (
        <div style={modalBase}>
            <div style={{ ...box, padding: 40, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "rgba(52,211,153,0.1)", border: "0.5px solid rgba(52,211,153,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title} Successful</h2>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>₦{Number(amount).toLocaleString()} · {reason}</p>
                <button className="action-btn gold" onClick={onClose}>Done</button>
            </div>
        </div>
    );

    return (
        <div style={modalBase}>
            <div style={box}>
                {/* Header */}
                <div style={{ padding: "18px 24px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "rgba(255,255,255,0.02)" }}>
                    <div>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: 2 }}>LAN Bank</p>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: titleColor }}>{title}</h3>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.05)", border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                </div>

                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Sender / context */}
                    <div style={{ background: CARD2, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a5a72", marginBottom: 6 }}>
                            {isWithdraw ? "Deducting from" : isWallet ? "Sending from" : "Sending to bank account"}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{seller?.sellerName || seller?.bankDetails?.accountName || "Unknown Seller"}</p>
                        <p style={{ fontSize: 11, color: GOLD, fontFamily: "monospace", marginTop: 2 }}>{fmtAcct(seller?.accountNumber)}</p>
                        <p style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>Balance: {fmtShort(seller?.accountBalance)}</p>
                    </div>

                    {/* WALLET: pick recipient */}
                    {isWallet && (
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>Recipient Seller</p>
                            <input className="bank-input" placeholder="Search by name or account…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
                            <div style={{ maxHeight: 180, overflowY: "auto", border: `0.5px solid ${BORDER}`, borderRadius: 8 }}>
                                {filtered.slice(0, 20).map(s => (
                                    <div key={s.id} className={`sel-row${selected?.id === s.id ? " active" : ""}`} onClick={() => setSelected(s)}>
                                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${GOLD}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                                            {initials(s.sellerName || s.bankDetails?.accountName)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{s.sellerName || s.bankDetails?.accountName || "Unknown"}</p>
                                            <p style={{ fontSize: 10, color: "#4a5a72", fontFamily: "monospace" }}>{fmtAcct(s.accountNumber)}</p>
                                        </div>
                                        <p style={{ fontSize: 11, color: "#34d399" }}>{fmtShort(s.accountBalance)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BANK: bank details */}
                    {isBank && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD }}>Bank Details</p>
                            {[
                                ["Account Name", accountName, setAccountName, "e.g. John Doe"],
                                ["Account Number", accountNumber, setAccountNumber, "10-digit NUBAN"],
                                ["Bank Name", bankName, setBankName, "e.g. Access Bank"],
                                ["Bank Code", bankCode, setBankCode, "e.g. 044"],
                            ].map(([lbl, val, set, ph]) => (
                                <div key={lbl}>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>{lbl}</label>
                                    <input className="bank-input" value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                                </div>
                            ))}
                            <p style={{ fontSize: 11, color: "#64748b", background: "rgba(96,165,250,0.08)", border: "0.5px solid rgba(96,165,250,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                                ⚡ This sends real NGN via Flutterwave to the bank account above.
                            </p>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 8 }}>Amount (₦)</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: GOLD, fontWeight: 700, fontSize: 16, fontFamily: "'Playfair Display',serif" }}>₦</span>
                            <input className="bank-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ paddingLeft: 28 }} />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            {[1000, 5000, 10000, 50000].map(q => (
                                <button key={q} onClick={() => setAmount(String(q))} style={{ fontSize: 10, padding: "5px 10px", background: amount === String(q) ? GOLD : "rgba(184,150,62,0.08)", color: amount === String(q) ? NAVY : GOLD, border: `0.5px solid ${BORDER}`, borderRadius: 6, cursor: "pointer", fontFamily: "'Lato',sans-serif", fontWeight: 700 }}>
                                    ₦{q.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 8 }}>Reason / Memo *</label>
                        <textarea className="bank-input" rows={3} placeholder="e.g. Refund for reported book — Case #1234" value={reason} onChange={e => setReason(e.target.value)} style={{ resize: "vertical" }} />
                    </div>

                    {err && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171" }}>{err}</div>
                    )}

                    <button
                        className={`action-btn ${isWithdraw ? "danger" : isWallet ? "gold" : "navy"}`}
                        onClick={handleExecute}
                        disabled={sending || !amount || !reason || (isWallet && !selected) || (isBank && (!accountNumber || !bankCode || !accountName))}
                    >
                        {sending ? <div className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} /> : null}
                        {sending ? "Processing…" : isWithdraw ? `Debit ₦${Number(amount || 0).toLocaleString()}` : isWallet ? `Send ₦${Number(amount || 0).toLocaleString()} to Wallet` : `Send ₦${Number(amount || 0).toLocaleString()} to Bank`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── SELLER DETAIL PANEL ──────────────────────────────────────────── */
function SellerDetail({ seller, allSellers, onClose, onAction, adminUser }) {
    const [tab, setTab] = useState("overview");
    const [transfers, setTransfers] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loadingTxns, setLoadingTxns] = useState(false);

    useEffect(() => {
        if (tab !== "overview") loadTxns();
    }, [tab]);

    const handleWithdrawalAction = async (withdrawalId, action) => {
        try {
            const token = await auth.currentUser?.getIdToken(true);
            const res = await fetch("/api/lan-bank/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    mode: action === "approve" ? "withdrawal_approve" : "withdrawal_reject",
                    sellerId: seller.id,
                    targetId: withdrawalId,
                    amount: 0,
                    reason: action,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await loadTxns();
        } catch (e) {
            alert(e.message);
        }
    };

    const loadTxns = async () => {
        setLoadingTxns(true);
        try {
            const [sentSnap, recvSnap, wSnap] = await Promise.all([
                getDocs(query(collection(db, "transfers"), where("senderId", "==", seller.id), orderBy("createdAt", "desc"), limit(20))),
                getDocs(query(collection(db, "transfers"), where("recipientId", "==", seller.id), orderBy("createdAt", "desc"), limit(20))),
                getDocs(query(collection(db, "withdrawals"), where("sellerId", "==", seller.id), orderBy("requestedAt", "desc"), limit(20))),
            ]);
            const all = [
                ...sentSnap.docs.map(d => ({ id: d.id, ...d.data(), dir: "out" })),
                ...recvSnap.docs.map(d => ({ id: d.id, ...d.data(), dir: "in" })),
            ].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setTransfers(all);
            setWithdrawals(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch { }
        finally { setLoadingTxns(false); }
    };

    const name = seller.sellerName || seller.bankDetails?.accountName || "Unknown";
    const TABS = [["overview", "Overview"], ["transfers", "Transfers"], ["withdrawals", "Withdrawals"]];

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "stretch", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}>
            <div style={{ width: "100%", maxWidth: 520, background: BG, borderLeft: `0.5px solid ${BORDER}`, display: "flex", flexDirection: "column", overflowY: "auto" }} className="fade">
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a2f4a)`, backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)", backgroundSize: "22px 22px", padding: "28px 24px", flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display',serif" }}>
                                {initials(name)}
                            </div>
                            <div>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>{name}</h2>
                                <p style={{ fontSize: 11, color: GOLD, fontFamily: "monospace", marginTop: 2 }}>{fmtAcct(seller.accountNumber)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: `0.5px solid rgba(255,255,255,0.1)`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                    </div>
                    {/* Balance */}
                    <div style={{ background: "rgba(255,255,255,0.05)", border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Wallet Balance</p>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: "#fff" }}>₦{fmt(seller.accountBalance)}</p>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                        {[
                            { label: "Credit Wallet", color: "#34d399", mode: "wallet" },
                            { label: "Debit Wallet", color: "#f87171", mode: "withdraw" },
                            { label: "Send to Bank", color: "#60a5fa", mode: "bank" },
                        ].map(({ label, color, mode }) => (
                            <button key={mode} onClick={() => onAction(mode, seller)} style={{ padding: "9px 6px", background: `${color}12`, border: `0.5px solid ${color}30`, borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, color, fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em" }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: `0.5px solid ${BORDER}`, padding: "0 24px", flexShrink: 0, background: CARD }}>
                    {TABS.map(([key, lbl]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding: "13px 16px", background: "none", border: "none", borderBottom: tab === key ? `2px solid ${GOLD}` : "2px solid transparent", color: tab === key ? GOLD : "#4a5a72", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.15s" }}>
                            {lbl}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ padding: 24, flex: 1 }}>
                    {tab === "overview" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* Bank details */}
                            {seller.bankDetails && (
                                <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Real Bank Account</p>
                                    {[
                                        ["Account Name", seller.bankDetails.accountName],
                                        ["Account Number", seller.bankDetails.accountNumber],
                                        ["Bank", seller.bankDetails.bankName],
                                        ["Bank Code", seller.bankDetails.bankCode],
                                    ].map(([k, v]) => v ? (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                                            <span style={{ color: "#4a5a72" }}>{k}</span>
                                            <span style={{ color: "#e2e8f0", fontWeight: 600, fontFamily: k === "Account Number" ? "monospace" : "inherit" }}>{v}</span>
                                        </div>
                                    ) : null)}
                                </div>
                            )}
                            {/* Stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[
                                    ["Total Earnings", seller.totalEarnings, "#34d399"],
                                    ["Books Sold", seller.booksSold, "#60a5fa"],
                                    ["Account #", fmtAcct(seller.accountNumber), GOLD],
                                    ["Status", seller.status || "active", seller.status === "suspended" ? "#f87171" : "#34d399"],
                                ].map(([lbl, val, color]) => (
                                    <div key={lbl} style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
                                        <p style={{ fontSize: 9, color: "#4a5a72", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{lbl}</p>
                                        <p style={{ fontSize: 14, fontWeight: 700, color }}>{typeof val === "number" ? fmtShort(val) : val || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === "transfers" && (
                        <div>
                            {loadingTxns ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spin" style={{ width: 28, height: 28, border: `2px solid ${GOLD}30`, borderTopColor: GOLD, borderRadius: "50%" }} /></div>
                            ) : transfers.length === 0 ? (
                                <p style={{ fontSize: 13, color: "#4a5a72", textAlign: "center", padding: 40 }}>No transfers yet</p>
                            ) : transfers.map(t => (
                                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.dir === "in" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d={t.dir === "in" ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} stroke={t.dir === "in" ? "#34d399" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.dir === "in" ? t.senderName : t.recipientName}
                                        </p>
                                        <p style={{ fontSize: 10, color: "#4a5a72" }}>{t.note || "—"}</p>
                                    </div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: t.dir === "in" ? "#34d399" : "#f87171", flexShrink: 0 }}>
                                        {t.dir === "in" ? `+₦${t.amount?.toLocaleString()}` : `-₦${t.totalDeducted?.toLocaleString()}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "withdrawals" && (
                        <div>
                            {loadingTxns ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spin" style={{ width: 28, height: 28, border: `2px solid ${GOLD}30`, borderTopColor: GOLD, borderRadius: "50%" }} /></div>
                            ) : withdrawals.length === 0 ? (
                                <p style={{ fontSize: 13, color: "#4a5a72", textAlign: "center", padding: 40 }}>No withdrawals yet</p>
                            ) : withdrawals.map(w => (
                                <div key={w.id} style={{ padding: "12px 0", borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{fmtShort(w.amount)}</p>
                                            <p style={{ fontSize: 10, color: "#4a5a72" }}>
                                                {w.bankDetails?.bankName} · {w.bankDetails?.accountNumber}
                                            </p>
                                            <p style={{ fontSize: 10, color: "#4a5a72", marginTop: 2 }}>
                                                {w.bankDetails?.accountName}
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                                background: w.status === "completed" ? "rgba(52,211,153,0.1)"
                                                    : w.status === "rejected" ? "rgba(239,68,68,0.1)"
                                                        : "rgba(251,191,36,0.1)",
                                                color: w.status === "completed" ? "#34d399"
                                                    : w.status === "rejected" ? "#f87171"
                                                        : "#fbbf24",
                                            }}>
                                                {w.status}
                                            </span>

                                            {/* ← THE KEY FIX: only show actions for pending */}
                                            {w.status === "pending" && (
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button
                                                        onClick={() => handleWithdrawalAction(w.id, "approve")}
                                                        style={{
                                                            fontSize: 10, fontWeight: 700, padding: "4px 10px",
                                                            background: "rgba(52,211,153,0.12)",
                                                            border: "0.5px solid rgba(52,211,153,0.3)",
                                                            borderRadius: 6, cursor: "pointer", color: "#34d399",
                                                            fontFamily: "'Lato',sans-serif",
                                                        }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleWithdrawalAction(w.id, "reject")}
                                                        style={{
                                                            fontSize: 10, fontWeight: 700, padding: "4px 10px",
                                                            background: "rgba(239,68,68,0.1)",
                                                            border: "0.5px solid rgba(239,68,68,0.25)",
                                                            borderRadius: 6, cursor: "pointer", color: "#f87171",
                                                            fontFamily: "'Lato',sans-serif",
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


/* ── MAIN LAN BANK PAGE ───────────────────────────────────────────── */
export default function LANBankPage() {
    const [authUser, setAuthUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("balance");
    const [activeTab, setActiveTab] = useState("sellers"); // sellers | analytics
    const [activeSeller, setActiveSeller] = useState(null);
    const [modal, setModal] = useState(null); // { mode, seller }
    const [flutterwaveBalance, setFlutterwaveBalance] = useState(null);
    const [loadingFW, setLoadingFW] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u && OWNER_EMAILS.includes(u.email)) {
                setAuthUser(u); setIsOwner(true);
                await loadSellers();
                await fetchFlutterwaveBalance();
            } else if (u) {
                setAuthUser(u); setIsOwner(false);
            } else {
                setAuthUser(null); setIsOwner(false);
            }
            setCheckingAuth(false);
        });
        return () => unsub();
    }, []);

    const loadSellers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "sellers"));
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(s => s.id !== LAN_PLATFORM_UID);
            setSellers(data);
        } catch { }
        finally { setLoading(false); }
    };

    const fetchFlutterwaveBalance = async () => {
        setLoadingFW(true);
        try {
            const token = await auth.currentUser?.getIdToken(true);
            const res = await fetch("/api/flutterwave-balance", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFlutterwaveBalance(data.balance ?? data.available_balance ?? null);
            }
        } catch { }
        finally { setLoadingFW(false); }
    };

    const handleLogin = (u) => {
        setAuthUser(u); setIsOwner(true);
        loadSellers(); fetchFlutterwaveBalance();
    };

    /* ── Guards ── */
    if (checkingAuth) return (
        <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{G}</style>
            <div className="spin" style={{ width: 36, height: 36, border: `2px solid ${GOLD}30`, borderTopColor: GOLD, borderRadius: "50%" }} />
        </div>
    );
    if (!authUser || !isOwner) return <LoginScreen onLogin={handleLogin} />;

    /* ── Derived data ── */
    const totalWallet = sellers.reduce((s, x) => s + (x.accountBalance || 0), 0);
    const totalEarnings = sellers.reduce((s, x) => s + (x.totalEarnings || 0), 0);
    const totalBooks = sellers.reduce((s, x) => s + (x.booksSold || 0), 0);

    const filtered = sellers
        .filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                s.sellerName?.toLowerCase().includes(q) ||
                s.bankDetails?.accountName?.toLowerCase().includes(q) ||
                s.accountNumber?.toLowerCase().includes(q) ||
                fmtAcct(s.accountNumber).toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            if (sortBy === "balance") return (b.accountBalance || 0) - (a.accountBalance || 0);
            if (sortBy === "earnings") return (b.totalEarnings || 0) - (a.totalEarnings || 0);
            if (sortBy === "name") return (a.sellerName || "").localeCompare(b.sellerName || "");
            return 0;
        });

    return (
        <>
            <style>{G}</style>
            <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato', sans-serif" }}>

                {/* ── TOP BAR ── */}
                <div style={{ background: NAVY, borderBottom: `0.5px solid ${BORDER}`, backgroundImage: "radial-gradient(rgba(184,150,62,0.05) 1px,transparent 1px)", backgroundSize: "24px 24px", position: "sticky", top: 0, zIndex: 100 }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Logo */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 36, background: `${GOLD}18`, border: `0.5px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={GOLD} strokeWidth="1.5" /><path d="M9 22V12h6v10" stroke={GOLD} strokeWidth="1.5" /></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: GOLD, textTransform: "uppercase" }}>Learning Access Network</p>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 1 }}>LAN <em style={{ color: GOLD, fontStyle: "italic" }}>Bank</em></p>
                            </div>
                        </div>
                        {/* Nav */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {[["sellers", "Sellers"], ["analytics", "Analytics"]].map(([key, lbl]) => (
                                <button key={key} className={`nav-btn${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>{lbl}</button>
                            ))}
                        </div>
                        {/* Right */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={() => { loadSellers(); fetchFlutterwaveBalance(); }} style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${GOLD}20`, border: `0.5px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: GOLD }}>
                                {authUser.email?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

                    {/* ── HERO STATS STRIP ── */}
                    <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2f4a 100%)`, backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px", borderRadius: 16, border: `0.5px solid ${BORDER}`, padding: "28px 32px", marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24 }}>
                        {[
                            {
                                label: "Total Wallet Funds",
                                value: `₦${fmt(totalWallet)}`,
                                sub: `${sellers.length} active sellers`,
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 12V7H5a2 2 0 010-4h14v4M21 12v5H5a2 2 0 000 4h16v-5" stroke={GOLD} strokeWidth="1.5" /><path d="M21 12H17a2 2 0 000 4h4" stroke={GOLD} strokeWidth="1.5" /></svg>,
                                color: GOLD,
                            },
                            {
                                label: "Flutterwave Balance",
                                value: loadingFW ? "—" : flutterwaveBalance !== null ? `₦${fmt(flutterwaveBalance)}` : "N/A",
                                sub: "Live payout account",
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="#60a5fa" strokeWidth="1.5" /><path d="M1 10h22" stroke="#60a5fa" strokeWidth="1.5" /></svg>,
                                color: "#60a5fa",
                            },
                            {
                                label: "Total Earnings Generated",
                                value: `₦${fmt(totalEarnings)}`,
                                sub: "All-time seller revenue",
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                                color: "#34d399",
                            },
                            {
                                label: "Total Books Sold",
                                value: totalBooks.toLocaleString(),
                                sub: "Physical + digital",
                                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#a78bfa" strokeWidth="1.5" /></svg>,
                                color: "#a78bfa",
                            },
                        ].map(({ label, value, sub, icon, color }) => (
                            <div key={label}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <div style={{ width: 38, height: 38, background: `${color}12`, border: `0.5px solid ${color}30`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                                </div>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: color, marginBottom: 4 }}>{label}</p>
                                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{value}</p>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── SELLERS LIST ── */}
                    {activeTab === "sellers" && (
                        <div className="fade">
                            {/* Controls */}
                            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4a5a72" }}>
                                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <input className="bank-input" placeholder="Search by name, account number…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                                </div>
                                <select className="bank-input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
                                    <option value="balance">Sort: Balance ↓</option>
                                    <option value="earnings">Sort: Earnings ↓</option>
                                    <option value="name">Sort: Name A–Z</option>
                                </select>
                                <div style={{ fontSize: 11, color: "#4a5a72", padding: "0 4px" }}>{filtered.length} seller{filtered.length !== 1 ? "s" : ""}</div>
                            </div>

                            {loading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                                    <div className="spin" style={{ width: 36, height: 36, border: `2px solid ${GOLD}30`, borderTopColor: GOLD, borderRadius: "50%" }} />
                                </div>
                            ) : (
                                <>
                                    {/* Table header */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "8px 18px", marginBottom: 4 }}>
                                        {["Seller", "LAN Account", "Real Bank Account", "Wallet Balance", "Total Earned", ""].map(h => (
                                            <p key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2a3a52" }}>{h}</p>
                                        ))}
                                    </div>

                                    {/* Rows */}
                                    {filtered.map(s => {
                                        const sName = s.sellerName || s.bankDetails?.accountName || "Unknown";
                                        return (
                                            <div key={s.id} onClick={() => setActiveSeller(s)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "14px 18px", background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, marginBottom: 6, cursor: "pointer", transition: "all 0.15s", alignItems: "center" }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = `${GOLD}50`}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                                            >
                                                {/* Name */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}18`, border: `0.5px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                                                        {initials(sName)}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sName}</p>
                                                        <p style={{ fontSize: 10, color: "#4a5a72" }}>{s.booksSold || 0} books sold</p>
                                                    </div>
                                                </div>
                                                {/* LAN account */}
                                                <p style={{ fontSize: 11, color: GOLD, fontFamily: "monospace" }}>{fmtAcct(s.accountNumber)}</p>
                                                {/* Real bank */}
                                                <div style={{ minWidth: 0 }}>
                                                    {s.bankDetails?.accountNumber ? (
                                                        <>
                                                            <p style={{ fontSize: 11, color: "#e2e8f0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{s.bankDetails.accountNumber}</p>
                                                            <p style={{ fontSize: 10, color: "#4a5a72", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bankDetails.bankName}</p>
                                                        </>
                                                    ) : <p style={{ fontSize: 11, color: "#2a3a52" }}>No bank linked</p>}
                                                </div>
                                                {/* Wallet balance */}
                                                <div>
                                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: (s.accountBalance || 0) > 0 ? "#34d399" : "#4a5a72" }}>
                                                        ₦{fmt(s.accountBalance)}
                                                    </p>
                                                    {(s.accountBalance || 0) > 0 && <div style={{ marginTop: 4, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                                                        <div style={{ width: `${Math.min(100, ((s.accountBalance || 0) / (Math.max(...sellers.map(x => x.accountBalance || 0)) || 1)) * 100)}%`, height: "100%", background: GOLD, borderRadius: 2 }} />
                                                    </div>}
                                                </div>
                                                {/* Total earned */}
                                                <p style={{ fontSize: 12, color: "#94a3b8" }}>₦{fmt(s.totalEarnings)}</p>
                                                {/* Actions */}
                                                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setModal({ mode: "wallet", seller: s })} title="Credit wallet" style={{ width: 30, height: 30, background: "rgba(52,211,153,0.1)", border: "0.5px solid rgba(52,211,153,0.25)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                                    </button>
                                                    <button onClick={() => setModal({ mode: "withdraw", seller: s })} title="Debit wallet" style={{ width: 30, height: 30, background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.25)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                                    </button>
                                                    <button onClick={() => setModal({ mode: "bank", seller: s })} title="Send to bank" style={{ width: 30, height: 30, background: "rgba(96,165,250,0.1)", border: "0.5px solid rgba(96,165,250,0.25)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filtered.length === 0 && !loading && (
                                        <div style={{ textAlign: "center", padding: "64px 24px" }}>
                                            <p style={{ fontSize: 14, color: "#2a3a52" }}>No sellers found</p>
                                        </div>
                                    )}

                                    {/* Total row */}
                                    {filtered.length > 0 && (
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "12px 18px", background: `${GOLD}08`, border: `0.5px solid ${GOLD}30`, borderRadius: 10, marginTop: 8 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em" }}>TOTAL ({filtered.length})</p>
                                            <p />
                                            <p />
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: GOLD }}>₦{fmt(filtered.reduce((s, x) => s + (x.accountBalance || 0), 0))}</p>
                                            <p style={{ fontSize: 12, color: "#94a3b8" }}>₦{fmt(filtered.reduce((s, x) => s + (x.totalEarnings || 0), 0))}</p>
                                            <p />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── ANALYTICS TAB ── */}
                    {activeTab === "analytics" && (
                        <div className="fade" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                            {/* Top sellers by balance */}
                            <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>Top Wallets</p>
                                {[...sellers].sort((a, b) => (b.accountBalance || 0) - (a.accountBalance || 0)).slice(0, 8).map((s, i) => {
                                    const max = sellers[0]?.accountBalance || 1;
                                    const pct = Math.max(3, ((s.accountBalance || 0) / Math.max(...sellers.map(x => x.accountBalance || 0), 1)) * 100);
                                    return (
                                        <div key={s.id} style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{s.sellerName || s.bankDetails?.accountName || "Unknown"}</p>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>₦{fmt(s.accountBalance)}</p>
                                            </div>
                                            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                                                <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? GOLD : "#34d399", borderRadius: 2, opacity: 1 - i * 0.08 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Balance distribution */}
                            <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>Wallet Distribution</p>
                                {[
                                    ["₦0 (empty)", sellers.filter(s => !s.accountBalance || s.accountBalance === 0).length, "#2a3a52"],
                                    ["₦1–₦1,000", sellers.filter(s => s.accountBalance > 0 && s.accountBalance <= 1000).length, "#60a5fa"],
                                    ["₦1K–₦10K", sellers.filter(s => s.accountBalance > 1000 && s.accountBalance <= 10000).length, GOLD],
                                    ["₦10K–₦100K", sellers.filter(s => s.accountBalance > 10000 && s.accountBalance <= 100000).length, "#34d399"],
                                    ["₦100K+", sellers.filter(s => s.accountBalance > 100000).length, "#a78bfa"],
                                ].map(([lbl, count, color]) => (
                                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                            <p style={{ fontSize: 12, color: "#94a3b8" }}>{lbl}</p>
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color }}>{count} seller{count !== 1 ? "s" : ""}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Summary card */}
                            <div style={{ background: `linear-gradient(135deg, ${NAVY}, #1a2f4a)`, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px", backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)", backgroundSize: "22px 22px" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>Summary</p>
                                {[
                                    ["Total Sellers", sellers.length],
                                    ["Active Wallets", sellers.filter(s => (s.accountBalance || 0) > 0).length],
                                    ["Avg Wallet Balance", `₦${fmt(totalWallet / Math.max(sellers.length, 1))}`],
                                    ["Largest Wallet", `₦${fmt(Math.max(...sellers.map(s => s.accountBalance || 0)))}`],
                                    ["Sellers w/ Bank Linked", sellers.filter(s => s.bankDetails?.accountNumber).length],
                                    ["Total Wallet Pool", `₦${fmt(totalWallet)}`],
                                ].map(([lbl, val]) => (
                                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid rgba(184,150,62,0.1)" }}>
                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{lbl}</p>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALS & PANELS ── */}
            {activeSeller && (
                <SellerDetail
                    seller={activeSeller}
                    allSellers={sellers}
                    onClose={() => setActiveSeller(null)}
                    onAction={(mode, s) => { setModal({ mode, seller: s }); }}
                    adminUser={authUser}
                />
            )}
            {modal && (
                <TransferModal
                    seller={modal.seller}
                    allSellers={sellers}
                    mode={modal.mode}
                    onClose={() => setModal(null)}
                    onDone={() => { loadSellers(); }}
                    adminUser={authUser}
                />
            )}
        </>
    );
}