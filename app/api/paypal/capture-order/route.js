import { getAccessToken } from "@/lib/paypal";
import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
    const { orderID, bookId, buyerEmail, buyerName } = await req.json();
    const token = await getAccessToken();
    const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const capture = await res.json();
    if (capture.status !== "COMPLETED") return Response.json({ success: false });

    await setDoc(doc(db, "purchases", `${buyerEmail}_${bookId}`), {
        bookId, buyerEmail, buyerName,
        transactionId: capture.id,
        method: "paypal",
        paidAt: serverTimestamp(),
    });

    return Response.json({ success: true, transactionId: capture.id });
}