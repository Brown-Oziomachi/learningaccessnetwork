"use client"
import React from 'react';
import { Play, Clock, CheckCircle } from 'lucide-react';

export default function VideoScripts() {
    const videos = [
        {
            id: 1,
            title: "Getting Started with LAN Library",
            duration: "2 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "10 seconds",
                    content: "Hey! Welcome to LAN Library. I'm going to show you how to set up your account and start making money in just 2 minutes. Let's go!"
                },
                {
                    title: "STEP 1: Sign Up",
                    time: "30 seconds",
                    content: "First, go to LAN Library website. Click 'Sign Up' in the top right corner. Enter your name, email, and create a password. That's it - you're in!"
                },
                {
                    title: "STEP 2: Navigate the Platform",
                    time: "40 seconds",
                    content: "Once you're logged in, you'll see the home page with all available books. At the top, there's a menu button - click it. You'll see options like 'My Account', 'My Books', and 'Become a Seller'. These are important, so remember them."
                },
                {
                    title: "STEP 3: Understand Key Features",
                    time: "30 seconds",
                    content: "'My Books' is where you'll find books you've purchased. 'My Account' is where you manage your profile. And 'Become a Seller' - that's the golden button. That's where the money is made."
                },
                {
                    title: "CLOSING",
                    time: "10 seconds",
                    content: "That's the basics! In the next video, I'll show you exactly how to become a seller and upload your first book. See you there!"
                }
            ],
            keyPoints: ["Sign Up → Navigate → Key Features"]
        },
        {
            id: 2,
            title: "How to Upload and Sell Books",
            duration: "3 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "10 seconds",
                    content: "Ready to make your first sale? Let me show you exactly how to upload and sell books on LAN Library."
                },
                {
                    title: "STEP 1: Become a Seller",
                    time: "45 seconds",
                    content: "First, click 'Become a Seller' in the menu. You'll see a form. Fill in your full name, email, and phone number. Now, this is important - add your bank details carefully: account number, account name, and bank name. Double-check everything because this is where your money goes. Click submit and wait for approval - usually takes 24 hours."
                },
                {
                    title: "STEP 2: Upload Your Book",
                    time: "60 seconds",
                    content: "Once approved, you'll see 'Upload Document' button. Click it. Now fill in the details:\n\n• Book Title: Make it clear and searchable\n• Author Name: Your name or the author's name\n• Category: Choose the right category - Education, Business, etc.\n• Price: We'll talk about pricing in the next video, but start between ₦500 to ₦2,000\n• Pages: How many pages your PDF has\n• Description: Explain what the book is about in 2-3 sentences"
                },
                {
                    title: "STEP 3: Upload the PDF",
                    time: "45 seconds",
                    content: "Now upload your PDF file. Make sure it's high quality and readable. Click 'Upload PDF' and select your file from your computer. Wait for it to upload - this might take a minute depending on file size. Once uploaded, click 'Submit for Review'. Your book goes to admin for approval."
                },
                {
                    title: "CLOSING",
                    time: "20 seconds",
                    content: "That's it! Once approved, your book is live and people can buy it. You earn 85% of every sale. Next video, I'll show you the best pricing strategies. Let's go!"
                }
            ],
            keyPoints: ["Become Seller → Upload Details → Submit PDF"]
        },
        {
            id: 3,
            title: "Pricing Strategies That Work",
            duration: "2.5 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "10 seconds",
                    content: "Pricing is everything. Price too high, no sales. Price too low, you're losing money. Let me show you the sweet spot."
                },
                {
                    title: "STRATEGY 1: Research First",
                    time: "40 seconds",
                    content: "Before you set your price, search for similar books on LAN Library. If there's a biology textbook for ₦1,500 and yours is similar, don't price yours at ₦5,000 - nobody will buy it. Check what's selling and price competitively. If your book is better quality or more comprehensive, you can add ₦200-500 more."
                },
                {
                    title: "STRATEGY 2: Category Pricing",
                    time: "50 seconds",
                    content: "Different categories have different price ranges:\n\n• Past Questions: ₦300 - ₦800\n• Textbooks: ₦1,000 - ₦3,000\n• Professional Books: ₦2,000 - ₦5,000\n• Specialized Content: ₦3,000 - ₦10,000\n\nStudents buy cheaper books more often. Professionals buy expensive books but less frequently. Know your audience."
                },
                {
                    title: "STRATEGY 3: The Psychology",
                    time: "40 seconds",
                    content: "Use ₦999 instead of ₦1,000. Use ₦1,499 instead of ₦1,500. It looks cheaper psychologically. Also, if you have multiple books, create bundles - 'Buy 3 books for ₦3,000 instead of ₦4,500'. People love deals."
                },
                {
                    title: "STRATEGY 4: Test and Adjust",
                    time: "30 seconds",
                    content: "Start with a mid-range price. After 2 weeks, if you have no sales, reduce by ₦200-300. If you're getting lots of sales, you might be too cheap - increase the price slightly. Always be testing."
                },
                {
                    title: "CLOSING",
                    time: "10 seconds",
                    content: "Smart pricing = more sales = more money. Next, let's talk about marketing. See you!"
                }
            ],
            keyPoints: ["Research → Category Pricing → Psychology → Test"]
        },
        {
            id: 4,
            title: "Marketing Your Books Effectively",
            duration: "3 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "10 seconds",
                    content: "Your book is uploaded. Price is set. Now, how do you get people to actually buy it? Let me show you 5 marketing strategies that work."
                },
                {
                    title: "STRATEGY 1: Optimize Your Title",
                    time: "30 seconds",
                    content: "Your book title must be searchable. Don't just write 'Biology Notes'. Write 'SS3 Biology WAEC Past Questions and Answers 2020-2024'. Be specific. Include keywords students search for: exam name, year, subject."
                },
                {
                    title: "STRATEGY 2: Write a Killer Description",
                    time: "40 seconds",
                    content: "Your description should answer 3 questions:\n\n1. What's in this book?\n2. Who is it for?\n3. What will they gain?\n\nExample: 'This comprehensive guide contains 500 past questions for JAMB Chemistry with detailed explanations. Perfect for JAMB candidates preparing for 2025 exams. Covers all topics with step-by-step solutions.' See? Clear and compelling."
                },
                {
                    title: "STRATEGY 3: Use Social Media",
                    time: "50 seconds",
                    content: "Share your book on:\n\n• WhatsApp status with screenshots\n• Facebook groups for students\n• Twitter with hashtags like #JAMB2025 #WAECPrep\n• Instagram posts with book preview\n\nDon't just drop the link. Share a problem from the book and say 'Want the full solution? Get the book here.' Create curiosity. Give value first, then sell."
                },
                {
                    title: "STRATEGY 4: Leverage Student Networks",
                    time: "40 seconds",
                    content: "Find class representatives, course reps, and student leaders. Offer them a special deal: 'Promote my book to your class, and I'll give you 10% commission on each sale' or 'Buy 5 copies at a discount for your friends'. Word-of-mouth is powerful in schools."
                },
                {
                    title: "STRATEGY 5: Create Free Previews",
                    time: "30 seconds",
                    content: "Give the first chapter free. Let people see the quality. If it's good, they'll buy the full book. Share these previews everywhere. It builds trust and shows you're not scamming."
                },
                {
                    title: "CLOSING",
                    time: "20 seconds",
                    content: "Marketing is just showing the right people your book. Do these 5 things consistently, and you'll see sales. Next video, let's talk about your earnings. Let's go!"
                }
            ],
            keyPoints: ["Title → Description → Social Media → Networks → Free Preview"]
        },
        {
            id: 5,
            title: "Understanding Your Earnings",
            duration: "2 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "10 seconds",
                    content: "Money! Let's talk about how you get paid and when you get paid. This is important, so pay attention."
                },
                {
                    title: "PART 1: How Much You Earn",
                    time: "40 seconds",
                    content: "You earn 85% of every sale. LAN Library takes 15%. So if someone buys your book for ₦1,000, you get ₦850. If you sell 10 books at ₦1,000 each, that's ₦10,000 in sales. You get ₦8,500. Simple math. The more books you sell, the more you earn. One seller made ₦47,000 in one month from just 3 books. That's possible."
                },
                {
                    title: "PART 2: Tracking Your Sales",
                    time: "35 seconds",
                    content: "Go to your seller dashboard. You'll see:\n\n• Total sales amount\n• Number of books sold\n• Available balance (money you can withdraw)\n• Pending balance (recent sales still processing)\n\nCheck this daily. It motivates you to upload more books and market better."
                },
                {
                    title: "PART 3: Withdrawal Process",
                    time: "45 seconds",
                    content: "You need minimum ₦5,000 to withdraw. Once you reach it, click 'Request Withdrawal'. Enter the amount you want. Admin processes it within 3-5 business days, and the money hits your bank account. That's the account you provided when registering as a seller. If you haven't received payment after 7 days, contact support immediately."
                },
                {
                    title: "CLOSING",
                    time: "20 seconds",
                    content: "That's how the money flows. Upload quality books, price them right, market them well, and watch your earnings grow. Last video is real success stories. Let's finish strong!"
                }
            ],
            keyPoints: ["85% Commission → Dashboard → ₦5K Minimum Withdrawal"]
        },
        {
            id: 6,
            title: "Success Stories & Case Studies",
            duration: "3 minutes",
            sections: [
                {
                    title: "OPENING",
                    time: "15 seconds",
                    content: "Real people. Real money. Real stories. Let me share 3 sellers who are crushing it on LAN Library and exactly what they did."
                },
                {
                    title: "STORY 1: The Student Seller - Chioma",
                    time: "55 seconds",
                    content: "Chioma is a 300-level pharmacy student. She uploaded her handwritten pharmacy notes - just notes she used for her exams. She uploaded 5 different course notes at ₦800 each.\n\nFirst month: 12 sales = ₦8,160. She promoted in her department WhatsApp group.\nSecond month: 34 sales = ₦23,120. She asked satisfied buyers to refer friends.\nThird month: 67 sales = ₦45,560.\n\nTotal in 3 months: ₦76,840 from just notes she already had! Her advice: 'Start with what you already have. Don't wait for perfect content.'"
                },
                {
                    title: "STORY 2: The Past Question Expert - Tunde",
                    time: "55 seconds",
                    content: "Tunde uploads past questions. He has WAEC, JAMB, and NECO past questions for different subjects. He uploads one subject at a time - started with Mathematics. He priced each at ₦1,200. He markets heavily on Twitter during exam season using hashtags. During JAMB season, he made ₦126,000 in one month from just past questions. He now has 15 different past question books uploaded. His advice: 'Target exam seasons. That's when students are desperate and buying.'"
                },
                {
                    title: "STORY 3: The Professional - Dr. Adeyemi",
                    time: "55 seconds",
                    content: "Dr. Adeyemi is a medical doctor. He uploads medical study guides and clinical case books for medical students. Higher price - ₦3,500 to ₦6,000 per book. He doesn't sell as frequently, but when he sells, he earns big. He uploaded 8 books. He makes ₦80,000 - ₦150,000 per month consistently. His advice: 'Quality over quantity. Professional students will pay for high-quality, comprehensive content. Don't undersell yourself.'"
                },
                {
                    title: "CLOSING",
                    time: "20 seconds",
                    content: "Three different approaches. All making serious money. Student notes, past questions, or professional content - there's space for everyone. Start today, stay consistent, and you'll be the next success story. Now go make that money!"
                }
            ],
            keyPoints: ["Chioma (Notes) → Tunde (Past Q) → Dr. Adeyemi (Professional)"]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Cover Page */}
                <div className="bg-gradient-to-br from-blue-950 to-blue-950 text-white rounded-2xl p-12 mb-12 text-center shadow-xl">
                    <div className="mb-6">
                        <Play className="w-16 h-16 mx-auto mb-4" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4">LAN Library</h1>
                    <h2 className="text-3xl font-semibold mb-6">Video Training Scripts</h2>
                    <p className="text-xl text-blue-200 mb-2">Complete Guide to Selling Books Online</p>
                    <p className="text-blue-300">6 Video Series • Total Duration: 15.5 Minutes</p>
                    <div className="mt-8 pt-8 border-t border-blue-700">
                        <p className="text-sm text-blue-200">© 2025 Learning Access Network</p>
                    </div>
                </div>

                {/* Print Button */}
                <div className="mb-8 flex justify-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-950 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Download as PDF
                    </button>
                </div>

                {/* Videos */}
                {videos.map((video, index) => (
                    <div key={video.id} className="mb-12 bg-white rounded-2xl shadow-lg overflow-hidden break-inside-avoid">
                        {/* Video Header */}
                        <div className="bg-gradient-to-r from-blue-950 to-blue-800 text-white p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-white text-blue-950 font-bold px-3 py-1 rounded-full text-sm">
                                            Video {video.id}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-200 text-sm">
                                            <Clock className="w-4 h-4" />
                                            {video.duration}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{video.title}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Video Content */}
                        <div className="p-6">
                            {video.sections.map((section, sIndex) => (
                                <div key={sIndex} className="mb-6 last:mb-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-blue-950">{section.title}</h3>
                                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                            {section.time}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Key Points */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <h4 className="font-bold text-gray-900">Quick Memory Tips:</h4>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                    {video.keyPoints.map((point, pIndex) => (
                                        <p key={pIndex} className="text-gray-700 font-medium">{point}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Summary Page */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-blue-950 mb-6 text-center">Quick Reference Guide</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {videos.map((video) => (
                            <div key={video.id} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-950 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                        {video.id}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-blue-950 mb-1">{video.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{video.duration}</p>
                                        <p className="text-sm text-gray-700">{video.keyPoints[0]}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-300 text-center">
                        <p className="text-gray-600 mb-4">For more information, visit:</p>
                        <p className="text-blue-950 font-bold text-lg">www.lanlearning.com</p>
                        <p className="text-gray-500 text-sm mt-4">© 2025 Learning Access Network. All Rights Reserved.</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
        </div>
    );
}