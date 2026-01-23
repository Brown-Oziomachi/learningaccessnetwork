import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LAN Library - Digital Platform for Knowledge Access",
  description: "Learning Access Network is a digital platform designed to make knowledge easily accessible to everyone. Discover, read, and purchase books across various categories including education, personal development, business, technology, and more.",
  keywords: "learning, books, education, personal development, business books, technology books, online library, digital platform, knowledge access, universities library, documents",
  openGraph: {
    title: "LAN Library - Digital Platform for Knowledge Access",
    description: "Discover, read, and purchase books across various categories. Making knowledge easily accessible to everyone. Africa universities documentation for students",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.flutterwave.com/v3.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
