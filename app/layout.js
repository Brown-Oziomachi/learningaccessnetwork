import { Geist, Geist_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";
import PageTracker from "./hooks/usePageTracker";
import ClientProviders from "@/components/ClientProviders";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "LAN Library | The Global Student Library 📚",
  description:
    "Learning Access Network is a digital platform designed to make knowledge easily accessible to everyone. Discover, read, and purchase books across various categories including education, past questions, thesis, lecture notes, personal development, business, technology, and more.",
  keywords:
    "learning, books, education, personal development, business books, technology books, online library, digital platform, knowledge access, universities library, documents",
  openGraph: {
    title: "LAN Library - Digital Platform for Knowledge Access",
    description:
      "Discover, read, and purchase books across various categories. Making knowledge easily accessible to everyone. Africa universities documentation for students",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dancingScript.variable}>
      <head>
        {/* ── Google AdSense ── must be in <head> for Google's crawler */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8408243121163767"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* ── AdSense Auto Ads (page-level) ── */}
        <Script id="adsense-init" strategy="afterInteractive">
          {`
            (window.adsbygoogle = window.adsbygoogle || []).push({
              google_ad_client: "ca-pub-8408243121163767",
              enable_page_level_ads: true
            });
          `}
        </Script>

        {/* ── Flutterwave Payment Library ── */}
        <script src="https://checkout.flutterwave.com/v3.js" />

        {/* ── PDF.js ── */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function () {
                if (window.pdfjsLib) {
                  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PageTracker />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}