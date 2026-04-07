"use client";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AiAskButton({ bookTitle, pdfUrl, bookId, userId }) {
  const router = useRouter();

  const handleOpen = () => {
    const params = new URLSearchParams({
      bookTitle: bookTitle || "",
      bookId: bookId || "",
      pdfUrl: pdfUrl || "",
      userId: userId || "anonymous",
    });
    router.push(`/ai-chat?${params.toString()}`);
  };

  return (
    <button
      onClick={handleOpen}
      className="w-full relative overflow-hidden bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all group"
    >
      <div className="absolute inset-0 w-1/2 bg-sky-400/10 skew-x-[-20deg] -left-full group-hover:left-full transition-all duration-500" />
      <Sparkles size={16} className="text-sky-400" />
      <span>Ask LAN AI about this book</span>
    </button>
  );
}
