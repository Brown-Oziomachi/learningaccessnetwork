// Inside your app/api/webhooks/flutterwave/route.js:

import { sendServerNotification } from "@/lib/notificationEngine";

// Down inside your successful payment ledger completion section:
try {
    await sendServerNotification({
        type: "sale_alert",
        to: activeSellerEmail, // extracted server metadata parameter email
        userId: activeSellerId,
        data: {
            sellerName: verifiedBook.sellerName,
            bookTitle: verifiedBook.title,
            amount: amount,
            netEarning: netEarning,
            buyerEmail: customer.email,
            currentBalance: currentBalance // derived from your server transaction read snap
        }
    });
} catch (notificationError) {
    console.error("📧 Non-blocking mailer warning:", notificationError.message);
}