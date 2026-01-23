// app/api/send-seller-notification/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request) {
    try {
        const { sellerId, bookTitle, amount, netEarning, buyerEmail } = await request.json();

        // Get seller details
        const sellerDoc = await getDoc(doc(db, "users", sellerId));

        if (!sellerDoc.exists()) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        const sellerData = sellerDoc.data();
        const sellerEmail = sellerData.email;
        const sellerName = sellerData.displayName || `${sellerData.firstName} ${sellerData.surname}`;

        // Get updated balance
        const sellerAccountDoc = await getDoc(doc(db, "sellers", sellerId));
        const currentBalance = sellerAccountDoc.exists()
            ? sellerAccountDoc.data().accountBalance
            : netEarning;
        
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: 'LAN Library <noreply@yourdomain.com>',
            to: sellerEmail,
            subject: '🎉 You made a sale on LAN Library!',
            html: getEmailTemplate({
                sellerName,
                bookTitle,
                amount,
                netEarning,
                buyerEmail,
                currentBalance
            })
        });
        
        // For now, just log the notification
        console.log('Seller notification:', {
            to: sellerEmail,
            bookTitle,
            amount,
            netEarning,
            buyerEmail
        });

        return NextResponse.json({
            success: true,
            message: "Notification sent successfully"
        });

    } catch (error) {
        console.error("Notification error:", error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}

function getEmailTemplate(data) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    font-size: 18px;
                    color: #1e3a8a;
                    margin-bottom: 20px;
                }
                .highlight {
                    background: #f0f9ff;
                    border-left: 4px solid #3b82f6;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .amount {
                    font-size: 36px;
                    color: #16a34a;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .details {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .details-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                .details-row:last-child {
                    border-bottom: none;
                }
                .label {
                    color: #6b7280;
                    font-weight: 500;
                }
                .value {
                    color: #111827;
                    font-weight: 600;
                }
                .button {
                    display: inline-block;
                    background: #16a34a;
                    color: white;
                    padding: 14px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                    text-align: center;
                }
                .button:hover {
                    background: #15803d;
                }
                .footer {
                    background: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }
                .info-box {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                @media only screen and (max-width: 600px) {
                    .container {
                        margin: 0;
                        border-radius: 0;
                    }
                    .content {
                        padding: 20px;
                    }
                    .amount {
                        font-size: 28px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Congratulations!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">You just made a sale!</p>
                </div>
                
                <div class="content">
                    <p class="greeting">Hi ${data.sellerName},</p>
                    
                    <p>Great news! Your book <strong>"${data.bookTitle}"</strong> has been purchased.</p>
                    
                    <div class="highlight">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Earning</p>
                        <div class="amount">₦${data.netEarning.toLocaleString()}</div>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            (80% of ₦${data.amount.toLocaleString()})
                        </p>
                    </div>
                    
                    <div class="details">
                        <h3 style="margin-top: 0; color: #1e3a8a;">Sale Details</h3>
                        <div class="details-row">
                            <span class="label">Book Title:</span>
                            <span class="value">${data.bookTitle}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Sale Amount:</span>
                            <span class="value">₦${data.amount.toLocaleString()}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Platform Fee (20%):</span>
                            <span class="value" style="color: #ef4444;">-₦${(data.amount * 0.20).toLocaleString()}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Your Earning (80%):</span>
                            <span class="value" style="color: #16a34a;">₦${data.netEarning.toLocaleString()}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Buyer:</span>
                            <span class="value">${data.buyerEmail}</span>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <strong>💰 New Account Balance:</strong> ₦${data.currentBalance.toLocaleString()}
                        <br>
                        <small style="color: #78716c;">
                            You can withdraw your earnings anytime. Minimum withdrawal is ₦1,000.
                        </small>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://yourdomain.com/my-account/seller-account" class="button">
                            View Seller Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Keep up the great work! Every sale brings you closer to your goals.
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin: 0 0 10px 0;"><strong>LAN Library</strong></p>
                    <p style="margin: 0; font-size: 12px;">
                        This is an automated notification. Please do not reply to this email.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px;">
                        <a href="https://yourdomain.com" style="color: #3b82f6; text-decoration: none;">Visit Website</a> | 
                        <a href="https://yourdomain.com/support" style="color: #3b82f6; text-decoration: none;">Support</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}
