// app/api/webhooks/flutterwave/route.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
    from: 'Sales <noreply@yourdomain.com>',
    to: sellerEmail,
    subject: '🎉 You made a sale!',
    html: getEmailTemplate(data)
});