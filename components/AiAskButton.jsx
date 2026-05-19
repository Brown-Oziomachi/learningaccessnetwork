// components/AiAskButton.jsx
"use client";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";


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
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

                .mm-root { font-family:'Lato',sans-serif; background:${BG}; color:${NAVY}; }
                .lan-serif { font-family:'Playfair Display',Georgia,serif; }

                /* header dot-grid */
                .mm-header {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* hero */
                .mm-hero {
                    background-color:${NAVY};
                    background-image:
                        radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px),
                        radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);
                    background-size:28px 28px,14px 14px;
                    background-position:0 0,7px 7px;
                }

                /* stat card */
                .stat-card {
                    background:#fff;
                    border:0.5px solid #e5ddd0;
                    padding:28px 20px;
                    text-align:center;
                    transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;
                }
                .stat-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(13,34,68,0.12); border-color:${GOLD}; }

                /* video section bg */
                .video-bg {
                    background-color:${NAVY};
                    background-image:
                        repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px),
                        repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px);
                }

                /* video card */
                .vid-card {
                    background:#fff;
                    transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;
                    border:0.5px solid #e5ddd0;
                    overflow:hidden;
                    cursor:pointer;
                }
                .vid-card:hover { box-shadow:0 20px 48px rgba(13,34,68,0.18); border-color:${GOLD}; }
                .vid-card:hover .vid-thumb { transform:scale(1.05); }
                .vid-thumb { transition:transform 0.5s cubic-bezier(.4,0,.2,1); }

                /* step card */
                .step-card {
                    background:rgba(255,255,255,0.04);
                    border:0.5px solid rgba(184,150,62,0.2);
                    padding:32px 28px;
                    transition:border-color 0.22s,background 0.22s;
                    flex-shrink:0;
                }
                .step-card:hover { border-color:${GOLD}; background:rgba(184,150,62,0.05); }

                /* benefits bg */
                .benefits-bg {
                    background:${CREAM};
                    background-image:radial-gradient(rgba(13,34,68,0.05) 1px,transparent 1px);
                    background-size:22px 22px;
                }

                /* gold line */
                .gold-line { display:flex; align-items:center; gap:14px; }
                .gold-line::before,.gold-line::after { content:""; flex:1; height:1px; background:rgba(184,150,62,0.3); }

                /* sbar hide */
                .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
                .sbar-none::-webkit-scrollbar { display:none; }

                /* play btn */
                .play-btn {
                    width:64px; height:64px;
                    background:rgba(255,255,255,0.18); backdrop-filter:blur(8px);
                    border-radius:50%; border:2px solid rgba(255,255,255,0.4);
                    display:flex; align-items:center; justify-content:center;
                    transition:transform 0.2s,background 0.2s;
                }
                .vid-card:hover .play-btn { transform:scale(1.1); background:rgba(255,255,255,0.28); }

                /* cta section */
                .cta-bg {
                    background-color:${NAVY};
                    background-image:
                        repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px),
                        repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(255,255,255,0.018) 12px,rgba(255,255,255,0.018) 13px);
                }

                @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                .anim-up   { animation:slideUp 0.6s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-2 { animation:slideUp 0.6s 0.12s cubic-bezier(.4,0,.2,1) both; }
                .anim-up-3 { animation:slideUp 0.6s 0.24s cubic-bezier(.4,0,.2,1) both; }
            `}</style>

      <button
        style={{ background: GOLD }}
        onClick={handleOpen}
        className="w-full relative overflow-hidden  px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-#0d2244 active:scale-[0.98] transition-all group"
      >
        <div className="absolute inset-0 w-1/2 skew-x-[-20deg] -left-full group-hover:left-full transition-all duration-500" />
        <Sparkles size={16} className="text-sky-400" />
        <span style={{ color: NAVY }} className="font-bold">
          Ask LAN AI about this book
        </span>
      </button>
    </>
  );
}
