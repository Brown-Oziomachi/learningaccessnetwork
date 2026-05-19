// app/profile/[slug]/page.js
// ─────────────────────────────────────────────────────────────
// Complete rewrite: Server-side OpenGraph metadata engine +
// Full client-side interactive profile view with book grid,
// follow functionality, search/filter, and guest CTAs.
// ─────────────────────────────────────────────────────────────

import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import Navbar from "@/components/NavBar";
import Link from "next/link";
import ClientProfileContent from "../profile";

/* ═══════════════════════════════════════════════════════════
   SERVER-SIDE SEO OPENGRAPH METADATA ENGINE
   Runs at request time on the server — never ships to the client.
   Powers rich WhatsApp / Twitter / iMessage link previews.
═══════════════════════════════════════════════════════════ */
export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    /* 1. Resolve slug → UID via sellers collection */
    const q = query(collection(db, "sellers"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (snap.empty) return buildFallbackMeta(slug);

    const sellerDoc = snap.docs[0];
    const sellerData = sellerDoc.data();
    const uid = sellerDoc.id;

    /* 2. Fetch user data for full profile info */
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return buildFallbackMeta(slug);

    const userData = userSnap.data();

    /* 3. Build display name and metadata */
    const title = sellerData?.title || userData?.title || "";
    const firstName = userData?.firstName || "";
    const surname = userData?.surname || "";
    const displayName =
      [title, firstName, surname].filter(Boolean).join(" ").trim() ||
      "LAN Educator";

    const department = userData?.department || sellerData?.department || "";
    const university = userData?.university || sellerData?.university || "";
    const photoURL =
      userData?.photoBase64 ||
      userData?.photoURL ||
      userData?.profilePicture ||
      null;

    const isLecturerRole =
      userData?.isLecturer ||
      userData?.role === "lecturer" ||
      ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"].includes(
        (title || "").toLowerCase()
      );

    const roleLabel = isLecturerRole ? "Academic Educator" : "Independent Creator";

    const metaTitle = `${displayName} — ${roleLabel} | LAN Library`;

    const metaDescription = [
      roleLabel,
      department && `${department}`,
      university && `at ${university}`,
      "— Browse their academic materials on LAN Library.",
    ]
      .filter(Boolean)
      .join(" ");

    const images = photoURL
      ? [{ url: photoURL, width: 400, height: 400, alt: displayName }]
      : [
          {
            url: "https://learningaccessnetwork.vercel.app/og-default.png",
            width: 1200,
            height: 630,
          },
        ];

    return {
      title: metaTitle,
      description: metaDescription,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: "profile",
        images,
        siteName: "LAN Library",
        url: `https://learningaccessnetwork.vercel.app/profile/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDescription,
        images: photoURL ? [photoURL] : [],
      },
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return buildFallbackMeta(slug);
  }
}

function buildFallbackMeta(slug) {
  return {
    title: "Educator Profile | LAN Library",
    description:
      "Browse academic study materials and resources on LAN Library.",
    openGraph: {
      title: "Educator Profile | LAN Library",
      description:
        "Browse academic study materials and resources on LAN Library.",
      images: [
        {
          url: "https://learningaccessnetwork.vercel.app/og-default.png",
          width: 1200,
          height: 630,
        },
      ],
      siteName: "LAN Library",
    },
    twitter: {
      card: "summary_large_image",
      title: "Educator Profile | LAN Library",
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT (Server → passes slug to client)
═══════════════════════════════════════════════════════════ */
export default async function ProfilePage({ params }) {
  const { slug } = await params;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1ea" }}>
      <Navbar />
      <ClientProfileContent sellerSlug={slug} />
    </div>
  );
}