import React, { useState } from "react";
import {
  Check,
  X,
  AlertCircle,
  FileText,
  User,
  Mail,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Tag,
  Hash,
  Calendar,
  DollarSign,
  Layers,
  Building2,
  Upload,
  Link2,
  Clock,
  Send,
  Lock,
  UserX,
  Trash2,
  AlertTriangle,
  Eye,
} from "lucide-react";

// ==================== BOOK APPROVAL MODAL ====================
export const BookApprovalModal = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  checkPdfDuplicate,
  formatDate,
  getStatusColor,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  if (!isOpen || !item) return null;

  const getFileType = (url) => {
    if (!url) return "Unknown";
    if (url.includes("firebasestorage.googleapis.com"))
      return "Firebase Storage";
    if (url.includes("drive.google.com")) return "Google Drive";
    if (url.includes("dropbox.com")) return "Dropbox";
    return "External Link";
  };

  const isDirectUpload = item.uploadMethod === "direct_upload";
  const pdfSrc =
    item.embedUrl ||
    item.pdfUrl?.replace("/view", "/preview") ||
    item.pdfLink?.replace("/view", "/preview");

  const handleApprove = async () => {
    if (checkPdfDuplicate) {
      setCheckingDuplicate(true);
      const isDuplicate = await checkPdfDuplicate(item.pdfUrl || item.embedUrl);
      setCheckingDuplicate(false);
      if (isDuplicate) {
        alert(
          "⚠️ This PDF already exists in the database. Cannot approve duplicate.",
        );
        return;
      }
    }
    setActionType("approve");
    setShowConfirm(true);
  };

  const handleReject = () => {
    setActionType("reject");
    setShowReasonInput(true);
  };

  const confirmApprove = async () => {
    setIsProcessing(true);
    await onApprove(item);
    setIsProcessing(false);
    resetModal();
  };

  const confirmReject = async () => {
    setIsProcessing(true);
    await onReject(item, rejectionReason);
    setIsProcessing(false);
    resetModal();
  };

  const resetModal = () => {
    setShowConfirm(false);
    setActionType(null);
    setRejectionReason("");
    setShowReasonInput(false);
    setDescExpanded(false);
    onClose();
  };

  const S = {
    /* ── layout ── */
    backdrop: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "rgba(0,0,0,0.78)",
      backdropFilter: "blur(6px)",
    },
    modal: {
      position: "relative",
      width: "100%",
      maxWidth: 1440,
      height: "calc(100vh - 32px)",
      display: "flex",
      flexDirection: "column",
      background: "#080e1c",
      borderRadius: 16,
      border: "1px solid #1e293b",
      overflow: "hidden",
      boxShadow:
        "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
    },
    /* ── topbar ── */
    topbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 56,
      flexShrink: 0,
      background: "#0c1424",
      borderBottom: "1px solid #1a2540",
    },
    /* ── body row ── */
    body: { display: "flex", flex: 1, minHeight: 0 },
    /* ── left panel ── */
    leftPanel: {
      display: "flex",
      flexDirection: "column",
      width: "60%",
      flexShrink: 0,
      borderRight: "1px solid #1a2540",
      background: "#05090f",
    },
    viewerBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      height: 44,
      flexShrink: 0,
      background: "#0a1020",
      borderBottom: "1px solid #1a2540",
    },
    iframeWrap: { flex: 1, overflow: "hidden", position: "relative" },
    thumbStrip: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 16px",
      flexShrink: 0,
      background: "#0a1020",
      borderTop: "1px solid #1a2540",
    },
    /* ── right panel ── */
    rightPanel: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minWidth: 0,
      background: "#080e1c",
    },
    scrollArea: { flex: 1, overflowY: "auto", padding: "24px 24px 0" },
    actionBar: {
      flexShrink: 0,
      padding: "16px 24px",
      background: "#0c1424",
      borderTop: "1px solid #1a2540",
    },
    /* ── reusable ── */
    metaCell: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      padding: "12px 14px",
      background: "#0f172a",
      borderRadius: 10,
      border: "1px solid #1e293b",
    },
    metaLabel: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: 4,
    },
    metaVal: {
      fontSize: 15,
      fontWeight: 700,
      color: "#f1f5f9",
      lineHeight: 1.2,
    },
    metaValSm: {
      fontSize: 12,
      fontWeight: 700,
      color: "#f1f5f9",
      lineHeight: 1.3,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: "#3b4f6b",
      marginBottom: 10,
    },
    card: {
      padding: "12px 14px",
      borderRadius: 10,
      background: "#0f172a",
      border: "1px solid #1e293b",
    },
    divider: { height: 1, background: "#1a2540", margin: "0 0 20px" },
  };

  const spinner = (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.25)",
        borderTopColor: "#fff",
        animation: "bam-spin .7s linear infinite",
      }}
    />
  );

  return (
    <>
      <style>{`
        @keyframes bam-spin { to { transform: rotate(360deg); } }
        @keyframes bam-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .bam-scroll::-webkit-scrollbar { width: 4px; }
        .bam-scroll::-webkit-scrollbar-track { background: transparent; }
        .bam-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .bam-scroll::-webkit-scrollbar-thumb:hover { background: #334155; }
        .bam-confirm { animation: bam-up .2s ease-out; }
        .bam-approve-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
          background:#16a34a; color:#fff; border:none; border-radius:10px;
          padding:14px 20px; font-size:14px; font-weight:700; cursor:pointer;
          transition: background .15s, box-shadow .15s, transform .1s;
        }
        .bam-approve-btn:hover:not(:disabled) { background:#15803d; box-shadow:0 0 0 4px rgba(22,163,74,0.25); }
        .bam-approve-btn:active:not(:disabled) { transform:scale(.98); }
        .bam-approve-btn:disabled { opacity:.4; cursor:not-allowed; }
        .bam-reject-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
          background:#dc2626; color:#fff; border:none; border-radius:10px;
          padding:14px 20px; font-size:14px; font-weight:700; cursor:pointer;
          transition: background .15s, box-shadow .15s, transform .1s;
        }
        .bam-reject-btn:hover:not(:disabled) { background:#b91c1c; box-shadow:0 0 0 4px rgba(220,38,38,0.25); }
        .bam-reject-btn:active:not(:disabled) { transform:scale(.98); }
        .bam-reject-btn:disabled { opacity:.4; cursor:not-allowed; }
        .bam-ghost-btn {
          display:flex; align-items:center; justify-content:center; gap:6px;
          background:transparent; color:#64748b;
          border:1px solid #1e293b; border-radius:10px;
          padding:14px 18px; font-size:13px; font-weight:600;
          cursor:pointer; transition:all .15s; white-space:nowrap;
        }
        .bam-ghost-btn:hover { background:#1e293b; color:#e2e8f0; border-color:#334155; }
        .bam-sm-btn {
          display:flex; align-items:center; justify-content:center; gap:6px;
          padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600;
          cursor:pointer; border:none; transition:all .15s;
        }
        .bam-link-btn {
          display:flex; align-items:center; gap:5px;
          font-size:12px; font-weight:600; color:#60a5fa;
          text-decoration:none; padding:4px 10px;
          border-radius:6px; border:1px solid rgba(96,165,250,0.2);
          background:rgba(96,165,250,0.07); transition:all .15s;
        }
        .bam-link-btn:hover { background:rgba(96,165,250,0.15); }
        .bam-close-btn {
          width:32px; height:32px; border-radius:8px;
          background:transparent; border:1px solid #1e293b;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:#64748b; transition:all .15s;
        }
        .bam-close-btn:hover { background:#1e293b; color:#f1f5f9; }
      `}</style>

      <div style={S.backdrop} onClick={resetModal}>
        <div style={S.modal} onClick={(e) => e.stopPropagation()}>
          {/* ── TOP BAR ── */}
          <div style={S.topbar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, }} >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen style={{ width: 15, height: 15, color: "#818cf8" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Book Review
                </p>
                <p style={{ fontSize: 11, color: "#3b4f6b", margin: 0 }} className="mt-20">
                  Admin · Document approval
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* status badge */}
              {[
                item.status === "pending" && {
                  bg: "rgba(251,191,36,0.12)",
                  color: "#fbbf24",
                  dot: "#fbbf24",
                  border: "rgba(251,191,36,0.2)",
                  label: "Pending",
                },
                item.status === "approved" && {
                  bg: "rgba(34,197,94,0.12)",
                  color: "#4ade80",
                  dot: "#4ade80",
                  border: "rgba(34,197,94,0.2)",
                  label: "Approved",
                },
                item.status === "rejected" && {
                  bg: "rgba(239,68,68,0.12)",
                  color: "#f87171",
                  dot: "#f87171",
                  border: "rgba(239,68,68,0.2)",
                  label: "Rejected",
                },
              ]
                .filter(Boolean)
                .map(({ bg, color, dot, border, label }) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: bg,
                      color,
                      border: `1px solid ${border}`,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: dot,
                      }}
                    />
                    {label}
                  </span>
                ))}

              {/* upload method */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  ...(isDirectUpload
                    ? {
                        background: "rgba(139,92,246,0.12)",
                        color: "#c4b5fd",
                        border: "1px solid rgba(139,92,246,0.2)",
                      }
                    : {
                        background: "rgba(56,189,248,0.1)",
                        color: "#7dd3fc",
                        border: "1px solid rgba(56,189,248,0.18)",
                      }),
                }}
              >
                {isDirectUpload ? (
                  <Upload style={{ width: 11, height: 11 }} />
                ) : (
                  <Link2 style={{ width: 11, height: 11 }} />
                )}
                {isDirectUpload ? "Direct Upload" : "Drive Link"}
              </span>

              <button onClick={resetModal} className="bam-close-btn ">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={S.body}>
            {/* LEFT — PDF */}
            <div style={S.leftPanel}>
              <div style={S.viewerBar}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye style={{ width: 13, height: 13, color: "#3b4f6b" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "#3b4f6b",
                    }}
                  >
                    PDF Preview
                  </span>
                </div>
                {(item.pdfUrl || item.pdfLink || item.embedUrl) && (
                  <a
                    href={item.pdfUrl || item.pdfLink || item.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bam-link-btn"
                  >
                    Open original{" "}
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                )}
              </div>

              <div style={S.iframeWrap}>
                {pdfSrc ? (
                  <iframe
                    src={pdfSrc}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="PDF Preview"
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 12,
                      color: "#1e293b",
                    }}
                  >
                    <FileText style={{ width: 52, height: 52, opacity: 0.2 }} />
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      No PDF available
                    </p>
                  </div>
                )}
              </div>

              {item.driveFileId && (
                <div style={S.thumbStrip}>
                  <img
                    src={`https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w120`}
                    alt="cover"
                    style={{
                      width: 36,
                      height: 50,
                      objectFit: "cover",
                      borderRadius: 5,
                      border: "1px solid #1e293b",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120";
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#cbd5e1",
                        margin: 0,
                      }}
                    >
                      {item.bookTitle}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#3b4f6b",
                        margin: "2px 0 0",
                      }}
                    >
                      {getFileType(item.pdfUrl || item.pdfLink)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — details */}
            <div style={S.rightPanel}>
              <div className="bam-scroll" style={S.scrollArea}>
                {/* Title */}
                <div style={{ marginBottom: 20 }}>
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#f8fafc",
                      margin: "0 0 6px",
                      lineHeight: 1.25,
                      letterSpacing: "-.02em",
                    }}
                  >
                    {item.bookTitle}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#3b4f6b",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <User style={{ width: 13, height: 13 }} />
                    by{" "}
                    <span style={{ color: "#64748b", fontWeight: 600 }}>
                      {item.author}
                    </span>
                  </p>
                </div>

                {/* Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <div style={S.metaCell}>
                    <span style={S.metaLabel}>
                      <DollarSign style={{ width: 10, height: 10 }} />
                      Price
                    </span>
                    <span style={{ ...S.metaVal, color: "#4ade80" }}>
                      ₦{item.price?.toLocaleString()}
                    </span>
                  </div>
                  <div style={S.metaCell}>
                    <span style={S.metaLabel}>
                      <Layers style={{ width: 10, height: 10 }} />
                      Pages
                    </span>
                    <span style={S.metaVal}>{item.pages || "—"}</span>
                  </div>
                  <div style={S.metaCell}>
                    <span style={S.metaLabel}>
                      <Clock style={{ width: 10, height: 10 }} />
                      Submitted
                    </span>
                    <span style={S.metaValSm}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 20,
                  }}
                >
                  {item.category && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(59,130,246,0.1)",
                        color: "#60a5fa",
                        border: "1px solid rgba(59,130,246,0.18)",
                      }}
                    >
                      <Tag style={{ width: 10, height: 10 }} />
                      {item.category}
                    </span>
                  )}
                  {item.courseCode && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(139,92,246,0.1)",
                        color: "#c4b5fd",
                        border: "1px solid rgba(139,92,246,0.18)",
                      }}
                    >
                      <Hash style={{ width: 10, height: 10 }} />
                      {item.courseCode}
                    </span>
                  )}
                  {item.institutionalCategory && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(251,146,60,0.1)",
                        color: "#fb923c",
                        border: "1px solid rgba(251,146,60,0.18)",
                      }}
                    >
                      <Building2 style={{ width: 10, height: 10 }} />
                      {item.institutionalCategory}
                    </span>
                  )}
                  {item.format && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(100,116,139,0.12)",
                        color: "#94a3b8",
                        border: "1px solid rgba(100,116,139,0.18)",
                      }}
                    >
                      <FileText style={{ width: 10, height: 10 }} />
                      {item.format}
                    </span>
                  )}
                </div>

                <div style={S.divider} />

                {/* Seller */}
                <div style={{ marginBottom: 20 }}>
                  <p style={S.sectionTitle}>Seller</p>
                  <div
                    style={{
                      ...S.card,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {(item.sellerName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#f1f5f9",
                          margin: "0 0 3px",
                        }}
                      >
                        {item.sellerName}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Mail style={{ width: 11, height: 11 }} />
                        {item.sellerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={S.sectionTitle}>Description</p>
                    <div style={S.card}>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#94a3b8",
                          lineHeight: 1.7,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: descExpanded ? "unset" : 4,
                          WebkitBoxOrient: "vertical",
                          overflow: descExpanded ? "visible" : "hidden",
                        }}
                      >
                        {item.description}
                      </p>
                      {item.description.length > 220 && (
                        <button
                          onClick={() => setDescExpanded((p) => !p)}
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#60a5fa",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {descExpanded ? "Show less ↑" : "Show more ↓"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Table of contents */}
                {item.message && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={S.sectionTitle}>Table of Contents / Key Topics</p>
                    <div style={S.card}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          lineHeight: 1.8,
                          margin: 0,
                          whiteSpace: "pre-line",
                          display: "-webkit-box",
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Academic extras */}
                {(item.university ||
                  item.semester ||
                  item.level ||
                  item.session) && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={S.sectionTitle}>Academic Details</p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      {item.university && (
                        <div style={{ ...S.metaCell, gridColumn: "1 / -1" }}>
                          <span style={S.metaLabel}>University</span>
                          <span style={S.metaValSm}>{item.university}</span>
                        </div>
                      )}
                      {item.level && (
                        <div style={S.metaCell}>
                          <span style={S.metaLabel}>Level</span>
                          <span style={S.metaValSm}>{item.level}</span>
                        </div>
                      )}
                      {item.semester && (
                        <div style={S.metaCell}>
                          <span style={S.metaLabel}>Semester</span>
                          <span style={S.metaValSm}>{item.semester}</span>
                        </div>
                      )}
                      {item.session && (
                        <div style={S.metaCell}>
                          <span style={S.metaLabel}>Session</span>
                          <span style={S.metaValSm}>{item.session}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ height: 8 }} />
              </div>

              {/* ── ACTION BAR ── */}
              <div style={S.actionBar}>
                {/* Duplicate spinner */}
                {checkingDuplicate && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      marginBottom: 12,
                      background: "rgba(251,191,36,0.07)",
                      border: "1px solid rgba(251,191,36,0.18)",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid #fbbf24",
                        borderTopColor: "transparent",
                        animation: "bam-spin .7s linear infinite",
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fbbf24",
                        margin: 0,
                      }}
                    >
                      Checking for duplicate PDFs…
                    </p>
                  </div>
                )}

                {/* Approve confirm */}
                {showConfirm && actionType === "approve" && (
                  <div
                    className="bam-confirm"
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      background: "rgba(22,163,74,0.07)",
                      border: "1px solid rgba(22,163,74,0.22)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#4ade80",
                        margin: "0 0 4px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ShieldCheck style={{ width: 14, height: 14 }} /> Confirm
                      approval
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#86efac",
                        margin: "0 0 12px",
                        lineHeight: 1.6,
                      }}
                    >
                      This book will be published and visible to all users. The
                      seller will be notified.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={confirmApprove}
                        disabled={isProcessing}
                        className="bam-sm-btn"
                        style={{
                          flex: 1,
                          background: "#16a34a",
                          color: "#fff",
                        }}
                      >
                        {isProcessing ? (
                          <>{spinner} Processing…</>
                        ) : (
                          <>
                            <Check style={{ width: 14, height: 14 }} /> Yes,
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        disabled={isProcessing}
                        className="bam-sm-btn"
                        style={{
                          background: "transparent",
                          color: "#64748b",
                          border: "1px solid #1e293b",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject input */}
                {showReasonInput && actionType === "reject" && (
                  <div
                    className="bam-confirm"
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      background: "rgba(220,38,38,0.07)",
                      border: "1px solid rgba(220,38,38,0.22)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#f87171",
                        margin: "0 0 4px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <AlertCircle style={{ width: 14, height: 14 }} />{" "}
                      Rejection reason
                      <span
                        style={{ fontWeight: 400, opacity: 0.5, fontSize: 11 }}
                      >
                        (optional)
                      </span>
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this submission is being rejected…"
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: 13,
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 8,
                        color: "#f1f5f9",
                        resize: "none",
                        outline: "none",
                        marginBottom: 10,
                        lineHeight: 1.6,
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={confirmReject}
                        disabled={isProcessing}
                        className="bam-sm-btn"
                        style={{
                          flex: 1,
                          background: "#dc2626",
                          color: "#fff",
                        }}
                      >
                        {isProcessing ? (
                          <>{spinner} Processing…</>
                        ) : (
                          <>
                            <X style={{ width: 14, height: 14 }} /> Confirm
                            Rejection
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowReasonInput(false);
                          setRejectionReason("");
                        }}
                        disabled={isProcessing}
                        className="bam-sm-btn"
                        style={{
                          background: "transparent",
                          color: "#64748b",
                          border: "1px solid #1e293b",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary buttons */}
                {!showConfirm && !showReasonInput && !checkingDuplicate && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="bam-approve-btn"
                    >
                      <Check style={{ width: 18, height: 18 }} /> Approve
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="bam-reject-btn"
                    >
                      <X style={{ width: 18, height: 18 }} /> Reject
                    </button>
                    <button onClick={resetModal} className="bam-ghost-btn">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== REPLY MODAL ====================
export const ReplyModal = ({
  isOpen,
  onClose,
  item,
  replyMessage,
  setReplyMessage,
  onSend,
  sending,
}) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send Reply</h2>
                  <p className="text-sm text-purple-100">
                    Respond to user inquiry
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                To: {item?.email || item?.reporterEmail}
              </p>
              <p className="text-sm text-gray-600">
                Subject: Re: {item?.subject || item?.reason || "Your inquiry"}
              </p>
            </div>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none text-black focus:outline-none focus:border-purple-400"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={onSend}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Reply
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TRANSACTION MODAL ====================
export const TransactionModal = ({
  isOpen,
  onClose,
  item,
  formatDate,
  getStatusColor,
}) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Transaction Details</h2>
                  <p className="text-sm text-green-100">
                    View transaction information
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-950 mb-3">
                Transaction Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900">{item.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="font-bold text-2xl text-green-600">
                    ₦{item.amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status || "completed")}`}
                  >
                    {item.status || "completed"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-3">Book Details</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Book Title</p>
                  <p className="font-semibold text-gray-900">
                    {item.bookTitle}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Book ID</p>
                  <p className="font-mono text-sm text-gray-700">
                    {item.bookId}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Seller Information (Money Recipient)
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Seller Name</p>
                  <p className="font-semibold text-gray-900">
                    {item.sellerName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Seller Email</p>
                  <p className="font-semibold text-gray-900">
                    {item.sellerEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Seller ID</p>
                  <p className="font-mono text-sm text-gray-700">
                    {item.sellerId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-900 mb-3">
                Buyer Information
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Buyer Name</p>
                  <p className="font-semibold text-gray-900">
                    {item.buyerName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buyer Email</p>
                  <p className="font-semibold text-gray-900">
                    {item.buyerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buyer ID</p>
                  <p className="font-mono text-sm text-gray-700">
                    {item.buyerId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {item.paymentMethod && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-3">
                  Payment Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm text-gray-900">
                      {item.paymentMethod}
                    </p>
                  </div>
                  {item.transactionReference && (
                    <div>
                      <p className="text-xs text-gray-500">Reference</p>
                      <p className="font-mono text-sm text-gray-700">
                        {item.transactionReference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== USER MODAL ====================
export const UserModal = ({
  isOpen,
  onClose,
  item,
  formatDate,
  getStatusColor,
  onUpdateStatus,
  onDelete,
}) => {
  if (!isOpen || !item) return null;
  const isDeactivated = item.isDeactivated === true;
  const isBlocked =
    isDeactivated ||
    item.accountStatus === "suspended" ||
    item.accountStatus === "pending";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">User Account Details</h2>
                  <p className="text-sm text-indigo-100">Manage user account</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-950 mb-3">User Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Display Name</p>
                  <p className="font-semibold text-gray-900">
                    {item.displayName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{item.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">User ID</p>
                  <p className="font-mono text-xs text-gray-700">{item.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${item.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {item.role || "user"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  {isDeactivated ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      deactivated
                    </span>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.accountStatus || "active")}`}
                    >
                      {item.accountStatus || "active"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Joined</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {item.phoneNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="text-sm text-gray-900">{item.phoneNumber}</p>
                  </div>
                )}
                {item.lastLogin && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Login</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(item.lastLogin)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {item.bio && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Bio</p>
                <p className="text-sm text-gray-900">{item.bio}</p>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Account Management
              </h4>
              <p className="text-sm text-gray-700 mb-4">
                Manage this user's account status.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {isBlocked && (
                  <button
                    onClick={() => onUpdateStatus(item.id, "active")}
                    className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 col-span-2"
                  >
                    <Check className="w-4 h-4" />
                    {isDeactivated ? "Reactivate Account" : "Activate Account"}
                  </button>
                )}
                {!isBlocked && item.accountStatus !== "pending" && (
                  <button
                    onClick={() => onUpdateStatus(item.id, "pending")}
                    className="bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Set Pending
                  </button>
                )}
                {!isBlocked && item.accountStatus !== "suspended" && (
                  <button
                    onClick={() => onUpdateStatus(item.id, "suspended")}
                    className="bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend
                  </button>
                )}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </h4>
              <p className="text-sm text-gray-700 mb-4">
                Permanently delete this user account. This action cannot be
                undone.
              </p>
              <button
                onClick={() => onDelete(item.id)}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account Permanently
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
