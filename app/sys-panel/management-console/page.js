"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, addDoc, serverTimestamp, increment, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  FileText, Trash2, Check, X, Search, Calendar, User, Shield,
  Eye, Mail, MessageSquare, AlertCircle, TrendingUp,
  DollarSign, Users, BookOpen, ChevronRight, Send, RefreshCw, BarChart3,
  Settings, Flag, XCircle, AlertTriangle, UserX, Lock, ExternalLink,
  Download, Book, Phone, MapPin, CreditCard, Building,
  Clock, ThumbsUp, Smartphone, Bell, ChevronDown, Menu, Home,
  LayoutDashboard, Activity, PieChart, Layers, Star, ArrowUp, ArrowDown,
  MoreHorizontal, Filter, Plus, Minus, CheckCircle, Info
} from 'lucide-react';
import { BookApprovalModal, ReplyModal, TransactionModal, UserModal } from '@/components/ApprovalModal';
import FlwBalanceWidget from '@/components/admin/FlwBalanceWidget';
import { db, auth } from '@/lib/firebaseConfig';

/* ── CSS Variables & Global Styles ─────────────────────────────────────── */
const globalStyles = `
  :root {
    --nav-bg: #0d1b2e;
    --nav-border: rgba(255,255,255,0.07);
    --sidebar-bg: #111c2e;
    --sidebar-width: 220px;
    --card-bg: #162033;
    --card-border: rgba(255,255,255,0.07);
    --surface: #1a2740;
    --surface2: #1f2f47;
    --accent: #3b82f6;
    --accent-light: #60a5fa;
    --accent-glow: rgba(59,130,246,0.15);
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --radius: 12px;
    --radius-sm: 8px;
    --transition: 0.2s ease;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0b1628; color: var(--text-primary); font-family: 'Inter', system-ui, sans-serif; }

  .admin-shell { display: flex; min-height: 100vh; background: #0b1628; }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width);
    background: var(--sidebar-bg);
    border-right: 1px solid var(--nav-border);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
    overflow-y: auto;
  }
  .sidebar-logo {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--nav-border);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--accent); display: flex; align-items: center; justify-content: center;
  }
  .logo-text { font-size: 14px; font-weight: 700; color: var(--text-primary); }
  .logo-sub  { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

  .sidebar-section-label {
    font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
    color: var(--text-muted); text-transform: uppercase;
    padding: 16px 20px 6px;
  }
  .sidebar-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 20px; cursor: pointer;
    border-radius: 0; font-size: 13px; font-weight: 500;
    color: var(--text-secondary); transition: var(--transition);
    position: relative; border: none; background: none; width: 100%; text-align: left;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
  .sidebar-item.active {
    background: var(--accent-glow); color: var(--accent-light);
    border-left: 2px solid var(--accent);
  }
  .sidebar-item.active svg { color: var(--accent); }
  .sidebar-badge {
    margin-left: auto; background: var(--accent); color: #fff;
    font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 10px;
    min-width: 18px; text-align: center;
  }
  .sidebar-badge.warn { background: var(--warning); color: #000; }
  .sidebar-badge.danger { background: var(--danger); }

  /* Top bar */
  .topbar {
    background: var(--nav-bg); border-bottom: 1px solid var(--nav-border);
    padding: 0 24px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 99;
  }
  .topbar-left { display: flex; align-items: center; gap: 16px; }
  .topbar-search {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--card-border);
    border-radius: var(--radius-sm); padding: 6px 12px; min-width: 240px;
  }
  .topbar-search input {
    background: none; border: none; outline: none; color: var(--text-primary);
    font-size: 13px; width: 100%;
  }
  .topbar-search input::placeholder { color: var(--text-muted); }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .icon-btn {
    width: 36px; height: 36px; border-radius: var(--radius-sm);
    background: var(--surface); border: 1px solid var(--card-border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-secondary); transition: var(--transition);
  }
  .icon-btn:hover { background: var(--surface2); color: var(--text-primary); }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff; cursor: pointer;
  }

  /* Main content */
  .main-content {
    margin-left: var(--sidebar-width);
    display: flex; flex-direction: column; flex: 1; min-height: 100vh;
  }
  .page-content { padding: 24px; flex: 1; }

  /* Cards */
  .card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--radius); padding: 20px;
  }
  .card-sm { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 16px; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--radius); padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    transition: var(--transition); cursor: default;
  }
  .stat-card:hover { border-color: rgba(59,130,246,0.3); background: var(--surface); }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1.2; margin-top: 2px; }
  .stat-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 3px; }
  .stat-up { color: var(--success); }
  .stat-down { color: var(--danger); }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead tr { border-bottom: 1px solid var(--card-border); }
  .data-table th {
    padding: 10px 16px; text-align: left; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted);
  }
  .data-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--text-secondary); vertical-align: middle; }
  .data-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
  .data-table tbody tr:last-child td { border-bottom: none; }

  /* Status pills */
  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
  }
  .pill-dot { width: 6px; height: 6px; border-radius: 50%; }
  .pill-success { background: rgba(16,185,129,0.12); color: #34d399; }
  .pill-success .pill-dot { background: #34d399; }
  .pill-warn    { background: rgba(245,158,11,0.12); color: #fbbf24; }
  .pill-warn .pill-dot { background: #fbbf24; }
  .pill-danger  { background: rgba(239,68,68,0.12); color: #f87171; }
  .pill-danger .pill-dot { background: #f87171; }
  .pill-info    { background: rgba(59,130,246,0.12); color: #60a5fa; }
  .pill-info .pill-dot { background: #60a5fa; }
  .pill-gray    { background: rgba(148,163,184,0.1); color: #94a3b8; }
  .pill-gray .pill-dot { background: #94a3b8; }

  /* Section header */
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .section-title { font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
  .section-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* Action buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: var(--transition); border: none;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #2563eb; }
  .btn-success { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
  .btn-success:hover { background: rgba(16,185,129,0.25); }
  .btn-danger  { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background: rgba(239,68,68,0.22); }
  .btn-ghost   { background: var(--surface); color: var(--text-secondary); border: 1px solid var(--card-border); }
  .btn-ghost:hover { background: var(--surface2); color: var(--text-primary); }

  /* Book card */
  .book-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--radius); padding: 18px;
    transition: var(--transition);
  }
  .book-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-1px); }

  /* Withdrawal card */
  .withdrawal-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--radius); padding: 20px;
    border-left: 3px solid var(--warning);
  }

  /* Mini chart bars */
  .mini-bars { display: flex; align-items: flex-end; gap: 3px; height: 40px; }
  .mini-bar { flex: 1; background: var(--accent); border-radius: 2px 2px 0 0; opacity: 0.7; transition: var(--transition); min-width: 6px; }
  .mini-bar:hover { opacity: 1; }

  /* Quick actions row */
  .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 4px; }

  /* Input */
  .input-dark {
    width: 100%; background: var(--surface); border: 1px solid var(--card-border);
    border-radius: var(--radius-sm); padding: 9px 14px; color: var(--text-primary);
    font-size: 13px; outline: none; transition: var(--transition);
  }
  .input-dark:focus { border-color: rgba(59,130,246,0.5); }
  .input-dark::placeholder { color: var(--text-muted); }

  /* Activity feed */
  .activity-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .activity-item:last-child { border-bottom: none; }
  .activity-dot {
    width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0;
  }

  /* Progress bar */
  .progress-bar { height: 4px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }

  /* Responsive */
  @media (max-width: 1200px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .main-content { margin-left: 0; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

/* ── Platform Fee Section ───────────────────────────────────────────────── */
function PlatformFeeSection({ user }) {
  const [pendingFees, setPendingFees] = useState([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [payingOut, setPayingOut] = useState(false);
  const [lastPayout, setLastPayout] = useState(null);

  useEffect(() => { loadPendingFees(); loadLastPayout(); }, []);

  const loadPendingFees = async () => {
    try {
      setLoadingFees(true);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'platformFees'), where('disbursedToFlutterwave', '==', false));
      const snap = await getDocs(q);
      setPendingFees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); } finally { setLoadingFees(false); }
  };

  const loadLastPayout = async () => {
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'payoutLogs'), orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) setLastPayout({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } catch (err) { console.error(err); }
  };

  const totalPending = pendingFees.reduce((sum, f) => sum + (f.fee || 0), 0);

  const triggerPayout = async () => {
    if (totalPending < 100) { alert(`Min ₦100 required. Current: ₦${totalPending}`); return; }
    if (!confirm(`Disburse ₦${totalPending.toLocaleString()} from ${pendingFees.length} fees?`)) return;
    setPayingOut(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await Promise.all(pendingFees.map(fee => updateDoc(doc(db, 'platformFees', fee.id), { disbursedToFlutterwave: true, disbursedAt: new Date() })));
      alert(`✅ ₦${totalPending.toLocaleString()} marked as disbursed.`);
      await loadPendingFees();
    } catch (err) { alert(`❌ ${err.message}`); } finally { setPayingOut(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--card-border)', fontSize: 13 }}>
        {loadingFees ? <span style={{ color: 'var(--text-muted)' }}>Loading fees…</span> : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{pendingFees.length}</strong> pending fees — </span>
              <strong style={{ color: 'var(--success)' }}>₦{totalPending.toLocaleString()}</strong>
              {lastPayout && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Last: ₦{lastPayout.totalAmount?.toLocaleString()} on {lastPayout.createdAt?.toDate?.().toLocaleDateString('en-NG')}</div>}
            </div>
            <button onClick={loadPendingFees} className="icon-btn"><RefreshCw size={14} /></button>
          </div>
        )}
      </div>
      <button onClick={triggerPayout} disabled={payingOut || loadingFees || totalPending < 100}
        className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13 }}>
        {payingOut ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Processing…</> : <><DollarSign size={16} />Withdraw ₦{totalPending.toLocaleString()} to Flutterwave</>}
      </button>
      {totalPending < 100 && !loadingFees && <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Min ₦100 required.</p>}
    </div>
  );
}

/* ── Sidebar Nav Items ──────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    ]
  },
  {
    label: 'Content',
    items: [
      { id: 'advertisements', icon: BookOpen, label: 'Books', badgeKey: 'pendingAds' },
      { id: 'schools', icon: Building, label: 'Schools', badgeKey: 'pendingSchools' },
      { id: 'school-documents', icon: FileText, label: 'School Docs', badgeKey: 'pendingSchoolDocs' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { id: 'withdrawals', icon: Download, label: 'Withdrawals', badgeKey: 'pendingWithdrawals', badgeType: 'warn' },
      { id: 'transactions', icon: DollarSign, label: 'Transactions' },
      { id: 'settings', icon: Settings, label: 'Fee Settings' },
    ]
  },
  {
    label: 'Users & Support',
    items: [
      { id: 'users', icon: Users, label: 'All Users' },
      { id: 'support', icon: MessageSquare, label: 'Support', badgeKey: 'openTickets', badgeType: 'danger' },
      { id: 'reports', icon: Flag, label: 'Reports', badgeKey: 'pendingReports', badgeType: 'danger' },
    ]
  },
  {
    label: 'Feedback',
    items: [
      { id: 'feedbacks', icon: ThumbsUp, label: 'Book Feedback' },
      { id: 'article-feedbacks', icon: Star, label: 'Help Feedback' },
    ]
  }
];

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function ComprehensiveAdminPanel() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [advertisements, setAdvertisements] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [bookReports, setBookReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [schoolApplications, setSchoolApplications] = useState([]);
  const [schoolDocuments, setSchoolDocuments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [adminPinValue, setAdminPinValue] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState(null);
  const [confirmedWithdrawal, setConfirmedWithdrawal] = useState(null);
  const [articleFeedbacks, setArticleFeedbacks] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loadingSellerDetails, setLoadingSellerDetails] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) { setUser(currentUser); await checkAdminStatus(currentUser); }
      else { setUser(null); setIsAdmin(false); setCheckingAdmin(false); }
    });
    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async (currentUser) => {
    try {
      setCheckingAdmin(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.isAdmin === true) { setIsAdmin(true); await fetchAllData(); return; }
      }
      if (ADMIN_EMAILS.includes(currentUser.email)) {
        await updateDoc(doc(db, 'users', currentUser.uid), { isAdmin: true, role: 'admin', adminAccessGranted: serverTimestamp() });
        setIsAdmin(true); await fetchAllData(); return;
      }
      setIsAdmin(false);
    } catch (error) { console.error(error); setIsAdmin(false); } finally { setCheckingAdmin(false); }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdvertisements(), fetchSupportTickets(), fetchBookReports(),
        fetchTransactions(), fetchUsers(), fetchWithdrawals(),
        fetchSchoolApplications(), fetchSchoolDocuments(), fetchFeedbacks(), fetchArticleFeedbacks(),
      ]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchSellerFullDetails = async (sellerId) => {
    setLoadingSellerDetails(true);
    try {
      const [sellerDoc, salesSnap, transfersSnap, withdrawalsSnap, rechargesSnap] = await Promise.all([
        getDoc(doc(db, 'sellers', sellerId)),
        getDocs(query(collection(db, 'transactions'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'transfers'), where('senderId', '==', sellerId), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'withdrawals'), where('sellerId', '==', sellerId), orderBy('requestedAt', 'desc'))),
        getDocs(query(collection(db, 'recharges'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'))),
      ]);
      const seller = sellerDoc.exists() ? { id: sellerDoc.id, ...sellerDoc.data() } : null;
      const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const transfers = transfersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sellerWithdrawals = withdrawalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const recharges = rechargesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalEarned = sales.reduce((sum, s) => sum + (s.sellerEarnings || s.amount || 0), 0);
      const totalTransferred = transfers.reduce((sum, t) => sum + (t.totalDeducted || t.amount || 0), 0);
      const totalWithdrawn = sellerWithdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0);
      const totalSpentOnRecharges = recharges.reduce((sum, r) => sum + (r.amount || 0), 0);
      setSellerDetails({ seller, sales, transfers, withdrawals: sellerWithdrawals, recharges, stats: { totalEarned, totalTransferred, totalWithdrawn, totalSpentOnRecharges } });
    } catch (err) { console.error(err); } finally { setLoadingSellerDetails(false); }
  };

  const fetchSchoolApplications = async () => {
    try { const q = query(collection(db, 'schoolApplications'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setSchoolApplications(s.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); }
  };
  const fetchSchoolDocuments = async () => {
    try { const q = query(collection(db, 'schoolDocuments'), orderBy('uploadDate', 'desc')); const s = await getDocs(q); setSchoolDocuments(s.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); }
  };
  const fetchAdvertisements = async () => { const q = query(collection(db, 'advertMyBook'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setAdvertisements(s.docs.map(d => ({ id: d.id, ...d.data() }))); };
  const fetchSupportTickets = async () => { const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setSupportTickets(s.docs.map(d => ({ id: d.id, ...d.data() }))); };
  const fetchBookReports = async () => { const q = query(collection(db, 'bookReports'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setBookReports(s.docs.map(d => ({ id: d.id, ...d.data() }))); };
  const fetchTransactions = async () => {
    const [txnSnap, transferSnap] = await Promise.all([getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))), getDocs(query(collection(db, 'transfers'), orderBy('createdAt', 'desc')))]);
    const txns = txnSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'sale' }));
    const transfers = transferSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'transfer', bookTitle: `Transfer → ${d.data().recipientName || 'Unknown'}`, buyerEmail: d.data().senderName || d.data().senderId, sellerName: d.data().recipientName, amount: d.data().totalDeducted || d.data().amount }));
    const all = [...txns, ...transfers].sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)));
    setTransactions(all);
  };
  const fetchUsers = async () => { const s = await getDocs(collection(db, 'users')); setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))); };
  const fetchWithdrawals = async () => {
    try { const q = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')); const s = await getDocs(q); setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data(), requestedAtDate: d.data().requestedAt?.toDate() || new Date() }))); } catch (e) { console.error(e); }
  };
  const fetchFeedbacks = async () => {
    try {
      const q = query(collection(db, 'bookFeedbacks'), orderBy('createdAt', 'desc')); const s = await getDocs(q);
      const list = await Promise.all(s.docs.map(async (feedbackDoc) => {
        const fb = feedbackDoc.data();
        if (!fb.bookTitle && fb.bookId) { try { const bd = await getDoc(doc(db, 'advertMyBook', fb.bookId.replace('firestore-', ''))); if (bd.exists()) fb.bookTitle = bd.data().bookTitle || bd.data().title; } catch (e) { } }
        return { id: feedbackDoc.id, ...fb, createdAt: fb.createdAt?.toDate() || new Date() };
      }));
      setFeedbacks(list);
    } catch (e) { console.error(e); }
  };
  const fetchArticleFeedbacks = async () => {
    try { const q = query(collection(db, 'articleFeedback'), orderBy('createdAt', 'desc')); const s = await getDocs(q); setArticleFeedbacks(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))); } catch (e) { console.error(e); }
  };

  const checkPdfDuplicate = async (pdfUrl) => {
    if (!pdfUrl) return false; setCheckingDuplicate(true);
    try {
      const q = query(collection(db, 'advertMyBook'), where('pdfUrl', '==', pdfUrl), where('status', '==', 'approved'));
      const s = await getDocs(q);
      if (pdfUrl.includes('drive.google.com')) {
        const match = pdfUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
        if (match) {
          const fileId = match[1] || match[2] || match[3];
          const all = await getDocs(query(collection(db, 'advertMyBook'), where('status', '==', 'approved')));
          for (const d of all.docs) { const data = d.data(); if (data.driveFileId === fileId || data.pdfUrl?.includes(fileId) || data.pdfLink?.includes(fileId)) { return true; } }
        }
      }
      return !s.empty;
    } catch (e) { return false; } finally { setCheckingDuplicate(false); }
  };

  const updateAdvertisementStatus = async (id, status, ad) => {
    if (status === 'approved') { const isDup = await checkPdfDuplicate(ad.pdfUrl || ad.pdfLink); if (isDup) { alert('⚠️ Duplicate file. Cannot approve.'); return; } }
    try {
      await updateDoc(doc(db, 'advertMyBook', id), { status, reviewedAt: serverTimestamp(), reviewedBy: user.email });
      if (status === 'approved' && (ad.pdfUrl || ad.pdfLink)) { fetch('/api/book-embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: id, pdfUrl: ad.pdfUrl || ad.pdfLink, sellerId: ad.userId || ad.sellerId, title: ad.bookTitle || ad.title }) }).catch(() => { }); }
      if (status === 'approved') {
        const lecturerId = ad.sellerId; const lecturerName = ad.sellerName || "A lecturer"; const bookTitle = ad.bookTitle || "new material";
        const followersSnap = await getDocs(query(collection(db, "follows"), where("lecturerId", "==", lecturerId)));
        if (!followersSnap.empty) { await Promise.all(followersSnap.docs.map(fd => addDoc(collection(db, "notifications"), { userId: fd.data().followerId, type: 'new_upload', title: '📚 New Material Uploaded!', message: `${lecturerName} just uploaded: "${bookTitle}"`, link: `/lecturer-profile?sellerId=${lecturerId}`, createdAt: serverTimestamp(), read: false }))); }
      }
      setAdvertisements(advertisements.map(a => a.id === id ? { ...a, status } : a));
      alert(`✅ Book ${status}`); setShowModal(false);
    } catch (error) { console.error(error); alert("Error updating status."); }
  };

  const updateTicketStatus = async (id, status) => { await updateDoc(doc(db, 'supportTickets', id), { status, resolvedAt: serverTimestamp() }); setSupportTickets(supportTickets.map(t => t.id === id ? { ...t, status } : t)); };
  const updateReportStatus = async (id, status) => { await updateDoc(doc(db, 'bookReports', id), { status, resolvedAt: serverTimestamp() }); setBookReports(bookReports.map(r => r.id === id ? { ...r, status } : r)); };
  const updateUserStatus = async (userId, status) => {
    if (!confirm(`Set user to ${status}?`)) return;

    const updateData = {
      accountStatus: status,
      updatedAt: serverTimestamp()
    };

    // ── If reactivating, also clear the isDeactivated flag ──
    if (status === 'active') {
      updateData.isDeactivated = false;
      updateData.status = 'active';
    }

    // ── If deactivating, set the isDeactivated flag too ──
    if (status === 'suspended' || status === 'deactivated') {
      updateData.isDeactivated = true;
      updateData.status = status;
    }

    await updateDoc(doc(db, 'users', userId), updateData);
    fetchUsers();
  };  const deleteUserAccount = async (userId) => { if (!confirm('DELETE this user? Cannot undo!')) return; try { await deleteDoc(doc(db, 'users', userId)); fetchUsers(); setShowModal(false); } catch (e) { alert('Failed: ' + e.message); } };
  const deleteFeedback = async (feedbackId) => { if (!confirm('Delete this feedback?')) return; try { await deleteDoc(doc(db, 'bookFeedbacks', feedbackId)); setFeedbacks(feedbacks.filter(f => f.id !== feedbackId)); } catch (e) { alert('Failed: ' + e.message); } };

  const processFlutterwaveTransfer = async (withdrawal) => {
    try {
      const response = await fetch('/api/flutterwave-transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ withdrawal }) });
      const result = await response.json();
      if (result.success) return { success: true, transferId: result.transferId, reference: result.reference, status: result.status };
      throw new Error(result.error || 'Transfer failed');
    } catch (error) { return { success: false, error: error.message || 'Failed to process transfer' }; }
  };

  const approveWithdrawal = async (withdrawal) => {
    if (!skipConfirm) { setConfirmedWithdrawal(withdrawal); setShowConfirmModal(true); return; }
    setSkipConfirm(false);
    if (!withdrawal.bankDetails?.bankCode || !withdrawal.bankDetails?.accountNumber || !withdrawal.bankDetails?.accountName) { alert('❌ Incomplete bank details.'); return; }
    try {
      setProcessingWithdrawalId(withdrawal.id);
      const transferResult = await processFlutterwaveTransfer(withdrawal);
      if (!transferResult.success) { alert(`❌ Transfer Failed\n\n${transferResult.error}`); return; }
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { status: 'completed', processedAt: serverTimestamp(), flutterwaveTransferId: transferResult.transferId, flutterwaveReference: transferResult.reference, adminNote: 'Approved via Flutterwave', processedBy: user.email });
      const sellerDocRef = doc(db, 'sellers', withdrawal.sellerId);
      const sellerDoc = await getDoc(sellerDocRef);
      if (sellerDoc.exists()) await updateDoc(sellerDocRef, { totalWithdrawn: (sellerDoc.data().totalWithdrawn || 0) + withdrawal.amount, lastWithdrawalDate: serverTimestamp(), updatedAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { userId: withdrawal.sellerId, type: 'withdrawal_approved', title: 'Withdrawal Approved ✅', message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been processed. Ref: ${transferResult.reference}`, createdAt: serverTimestamp(), read: false });
      setWithdrawalSuccessData({ amount: withdrawal.amount, sellerName: withdrawal.sellerName, bankName: withdrawal.bankDetails.bankName, accountNumber: withdrawal.bankDetails.accountNumber, transferId: transferResult.transferId, reference: transferResult.reference });
      await fetchWithdrawals();
    } catch (error) { alert(`❌ Failed: ${error.message}`); } finally { setProcessingWithdrawalId(null); }
  };

  const rejectWithdrawal = async (withdrawalId, sellerId, amount) => {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) { alert('Please provide a reason'); return; }
    if (!confirm(`Reject ₦${amount.toLocaleString()}?`)) return;
    try {
      setProcessingWithdrawalId(withdrawalId);
      await updateDoc(doc(db, 'withdrawals', withdrawalId), { status: 'rejected', processedAt: serverTimestamp(), adminNote: reason, processedBy: user.email });
      await updateDoc(doc(db, 'sellers', sellerId), { accountBalance: increment(amount), updatedAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { userId: sellerId, type: 'withdrawal_rejected', title: 'Withdrawal Rejected ❌', message: `Your withdrawal of ₦${amount.toLocaleString()} was rejected. Funds returned. Reason: ${reason}`, createdAt: serverTimestamp(), read: false });
      alert('✅ Rejected and funds refunded.'); await fetchWithdrawals();
    } catch (error) { alert(`Failed: ${error.message}`); } finally { setProcessingWithdrawalId(null); }
  };

  const updateSchoolApplicationStatus = async (schoolId, status) => {
    if (!confirm(`${status} this school?`)) return;
    try {
      await updateDoc(doc(db, 'schoolApplications', schoolId), { status, verifiedSchool: status === 'approved', reviewedAt: serverTimestamp(), reviewedBy: user.email });
      const school = schoolApplications.find(s => s.id === schoolId);
      if (school) await addDoc(collection(db, 'notifications'), { userId: school.userId || school.email, type: `school_${status}`, title: status === 'approved' ? 'School Approved ✅' : 'School Rejected ❌', message: status === 'approved' ? `${school.schoolName} has been approved.` : `Your application for ${school.schoolName} was rejected.`, createdAt: serverTimestamp(), read: false });
      await fetchSchoolApplications();
    } catch (error) { alert('Failed: ' + error.message); }
  };

  const updateSchoolDocumentStatus = async (docId, status) => {
    if (!confirm(`${status} this document?`)) return;
    try {
      await updateDoc(doc(db, 'schoolDocuments', docId), { status, verified: status === 'approved', approvedDate: status === 'approved' ? serverTimestamp() : null, approvedBy: user.email });
      await fetchSchoolDocuments();
    } catch (error) { alert('Failed: ' + error.message); }
  };

  const sendEmailReply = async () => {
    if (!replyMessage.trim() || !selectedItem) { alert('Please write a message'); return; }
    setSending(true);
    try {
      await addDoc(collection(db, 'adminReplies'), { to: selectedItem.email || selectedItem.reporterEmail, subject: `Re: ${selectedItem.subject || selectedItem.reason || 'Your inquiry'}`, message: replyMessage, from: user.email, sentAt: serverTimestamp(), originalTicketId: selectedItem.id, type: activeSection });
      const collectionName = activeSection === 'support' ? 'supportTickets' : 'bookReports';
      await updateDoc(doc(db, collectionName, selectedItem.id), { adminResponse: replyMessage, status: 'resolved', resolvedAt: serverTimestamp() });
      setShowModal(false); setReplyMessage(''); setSelectedItem(null);
      if (activeSection === 'support') await fetchSupportTickets(); else await fetchBookReports();
    } catch (error) { alert(`Failed: ${error.message}`); } finally { setSending(false); }
  };

  const openModal = (type, item) => { setModalType(type); setSelectedItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalType(''); setSelectedItem(null); setReplyMessage(''); setPdfUrl(''); };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusPill = (status) => {
    const map = { pending: 'pill-warn', open: 'pill-warn', approved: 'pill-success', resolved: 'pill-success', active: 'pill-success', rejected: 'pill-danger', suspended: 'pill-danger', completed: 'pill-success' };
    return map[status] || 'pill-gray';
  };

  const stats = {
    totalRevenue: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    totalTransactions: transactions?.length || 0,
    totalUsers: users?.length || 0,
    totalBooks: advertisements?.length || 0,
    pendingAds: advertisements?.filter(a => a.status === 'pending').length || 0,
    openTickets: supportTickets?.filter(t => t.status === 'open').length || 0,
    pendingReports: bookReports?.filter(r => r.status === 'pending').length || 0,
    pendingSchools: schoolApplications?.filter(s => s.status === 'pending').length || 0,
    pendingSchoolDocs: schoolDocuments?.filter(d => d.status === 'pending').length || 0,
    pendingWithdrawals: withdrawals?.filter(w => w.status === 'pending').length || 0,
  };

  if (checkingAdmin) return (
    <div style={{ minHeight: '100vh', background: '#0b1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{globalStyles}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Verifying admin access…</p>
      </div>
    </div>
  );

  if (!user || !isAdmin) return (
    <div style={{ minHeight: '100vh', background: '#0b1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{globalStyles}</style>
      <div style={{ background: '#162033', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
        <Shield size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#e2e8f0', marginBottom: 8 }}>Unauthorized</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>You don't have admin access.</p>
        <a href="/home" style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>Go Home</a>
      </div>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="admin-shell">
      <style>{globalStyles}
        {`@keyframes spin { to { transform: rotate(360deg); } }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
         .page-content > * { animation: fadeIn 0.25s ease; }`}
      </style>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><BookOpen size={16} color="#fff" /></div>
          <div><div className="logo-text">LAN Library</div><div className="logo-sub">Admin Panel</div></div>
        </div>
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ id, icon: Icon, label, badgeKey, badgeType }) => {
              const badgeCount = badgeKey ? stats[badgeKey] : 0;
              return (
                <button key={id} className={`sidebar-item${activeSection === id ? ' active' : ''}`}
                  onClick={() => { setActiveSection(id); setSearchTerm(''); }}>
                  <Icon size={15} />
                  {label}
                  {badgeCount > 0 && <span className={`sidebar-badge${badgeType === 'warn' ? ' warn' : badgeType === 'danger' ? ' danger' : ''}`}>{badgeCount}</span>}
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ padding: '16px 20px', marginTop: 'auto', borderTop: '1px solid var(--nav-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-search">
              <Search size={14} color="var(--text-muted)" />
              <input placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="topbar-right">
            <button onClick={fetchAllData} className="icon-btn" title="Refresh"><RefreshCw size={15} /></button>
            <div className="icon-btn"><Bell size={15} /></div>
            <div className="avatar">{user.email?.[0]?.toUpperCase() || 'A'}</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <div>
              <div className="section-header">
                <div>
                  <div className="section-title"><LayoutDashboard size={18} />Dashboard Overview</div>
                  <div className="section-sub">Welcome back, {user.email?.split('@')[0]}</div>
                </div>
                <button onClick={fetchAllData} className="btn btn-ghost"><RefreshCw size={13} />Refresh</button>
              </div>

              {/* Stat cards */}
              <div className="stat-grid">
                {[
                  { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalTransactions} transactions`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                  { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: 'Registered accounts', icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                  { label: 'Total Books', value: stats.totalBooks.toLocaleString(), sub: `${stats.pendingAds} pending review`, icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                  { label: 'Pending Actions', value: (stats.pendingAds + stats.openTickets + stats.pendingWithdrawals).toString(), sub: 'Needs attention', icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div key={label} className="stat-card">
                    <div className="stat-icon" style={{ background: bg }}><Icon size={20} color={color} /></div>
                    <div>
                      <div className="stat-label">{label}</div>
                      <div className="stat-value">{value}</div>
                      <div className="stat-sub">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flutterwave widget */}
              <div style={{ marginBottom: 20 }}><FlwBalanceWidget /></div>

              {/* Grid: Alerts + Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Pending alerts */}
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16 }}><AlertCircle size={16} color="#f59e0b" />Pending Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Book Approvals', count: stats.pendingAds, color: '#f59e0b', section: 'advertisements' },
                      { label: 'Support Tickets', count: stats.openTickets, color: '#ef4444', section: 'support' },
                      { label: 'Withdrawals', count: stats.pendingWithdrawals, color: '#3b82f6', section: 'withdrawals' },
                      { label: 'School Apps', count: stats.pendingSchools, color: '#8b5cf6', section: 'schools' },
                      { label: 'Book Reports', count: stats.pendingReports, color: '#ef4444', section: 'reports' },
                    ].map(({ label, count, color, section }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        onClick={() => { setActiveSection(section); setSearchTerm(''); }}>
                        <div style={{ width: 3, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: count > 0 ? color : 'var(--text-muted)' }}>{count}</span>
                        <div className="progress-bar" style={{ width: 80, flexShrink: 0 }}>
                          <div className="progress-fill" style={{ background: color, width: `${Math.min(100, count * 10)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent transactions */}
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16 }}><Activity size={16} color="#3b82f6" />Recent Transactions</div>
                  <div>
                    {transactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => openModal('transaction', txn)}>
                        <div className="activity-dot" style={{ background: '#10b981' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{txn.bookTitle?.slice(0, 32)}{txn.bookTitle?.length > 32 ? '…' : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{txn.buyerEmail?.slice(0, 28)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>₦{txn.amount?.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(txn.createdAt)?.split(',')[0]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKS ─────────────────────────────────────────────────── */}
          {activeSection === 'advertisements' && (
            <div>
              <div className="section-header">
                <div className="section-title"><BookOpen size={18} />Books <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({advertisements.length})</span></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <input className="input-dark" placeholder="Search books by title…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {advertisements.filter(ad => ad.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase())).map((ad) => (
                  <div key={ad.id} className="book-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>{ad.bookTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {ad.author}</div>
                      </div>
                      <span className={`pill ${getStatusPill(ad.status)}`}><span className="pill-dot" />{ad.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
                      {[
                        { icon: Mail, text: ad.sellerEmail, color: '#60a5fa' },
                        { icon: DollarSign, text: `₦${ad.price?.toLocaleString()}`, color: '#34d399' },
                        { icon: Book, text: ad.category, color: 'var(--text-muted)' },
                        { icon: User, text: ad.sellerName, color: 'var(--text-secondary)' },
                        { icon: Calendar, text: formatDate(ad.createdAt)?.split(',')[0], color: 'var(--text-muted)' },
                      ].map(({ icon: Icon, text, color }) => text ? (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color }}>
                          <Icon size={12} />{text}
                        </div>
                      ) : null)}
                    </div>
                    <button onClick={() => openModal('advertisement', ad)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px' }}>
                      <Eye size={13} />Review & Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TRANSACTIONS ──────────────────────────────────────────── */}
          {activeSection === 'transactions' && (
            <div>
              <div className="section-header">
                <div className="section-title"><DollarSign size={18} />Transactions</div>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr>
                    {['Book', 'Buyer', 'Seller', 'Amount', 'Date', 'Status', ''].map(h => <th key={h}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{txn.bookTitle?.slice(0, 30)}</td>
                        <td>{txn.buyerEmail?.slice(0, 22)}</td>
                        <td>{txn.sellerName || txn.sellerEmail || 'N/A'}</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>₦{txn.amount?.toLocaleString()}</td>
                        <td style={{ fontSize: 11 }}>{formatDate(txn.createdAt)}</td>
                        <td><span className={`pill ${getStatusPill(txn.status || 'completed')}`}><span className="pill-dot" />{txn.status || 'completed'}</span></td>
                        <td><button onClick={() => openModal('transaction', txn)} className="icon-btn" style={{ width: 28, height: 28 }}><Eye size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USERS ─────────────────────────────────────────────────── */}
          {activeSection === 'users' && (
            <div>
              <div className="section-header">
                <div className="section-title"><Users size={18} />Users <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({users.length})</span></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <input className="input-dark" placeholder="Search by name, email or role…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr>{['Name', 'Email', 'Role', 'Status', 'Joined', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.role?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.displayName || 'N/A'}</td>
                        <td>{u.email}</td>
                        <td><span className={`pill ${u.role === 'admin' ? 'pill-info' : 'pill-gray'}`}>{u.role || 'user'}</span></td>
                        <td><span className={`pill ${getStatusPill(u.accountStatus || 'active')}`}><span className="pill-dot" />{u.accountStatus || 'active'}</span></td>
                        <td style={{ fontSize: 11 }}>{formatDate(u.createdAt)?.split(',')[0]}</td>
                        <td><button onClick={() => openModal('user', u)} className="icon-btn" style={{ width: 28, height: 28 }}><Eye size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUPPORT ───────────────────────────────────────────────── */}
          {activeSection === 'support' && (
            <div>
              <div className="section-header">
                <div className="section-title"><MessageSquare size={18} />Support Tickets</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <input className="input-dark" placeholder="Search tickets…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {supportTickets.filter(t => t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || t.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(ticket => (
                  <div key={ticket.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ticket.subject || 'No Subject'}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ticket.name} · {ticket.email}</div></div>
                      <span className={`pill ${getStatusPill(ticket.status)}`}><span className="pill-dot" />{ticket.status}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{ticket.message}</p>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{formatDate(ticket.createdAt)}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openModal('reply', ticket)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}><Mail size={12} />Reply</button>
                      <button onClick={() => updateTicketStatus(ticket.id, 'resolved')} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}><Check size={12} />Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORTS ───────────────────────────────────────────────── */}
          {activeSection === 'reports' && (
            <div>
              <div className="section-header"><div className="section-title"><Flag size={18} />Book Reports</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {bookReports.map(report => (
                  <div key={report.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{report.bookTitle}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{report.reporterEmail}</div></div>
                      <span className={`pill ${getStatusPill(report.status)}`}><span className="pill-dot" />{report.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#f87171', marginBottom: 6, fontWeight: 600 }}>{report.reason}</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{report.details}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openModal('reply', report)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}><Mail size={12} />Reply</button>
                      <button onClick={() => updateReportStatus(report.id, 'resolved')} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}><Check size={12} />Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WITHDRAWALS ───────────────────────────────────────────── */}
          {activeSection === 'withdrawals' && (
            <div>
              <div className="section-header">
                <div className="section-title"><Download size={18} />Withdrawals</div>
              </div>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Pending', count: withdrawals.filter(w => w.status === 'pending').length, color: '#f59e0b' },
                  { label: 'Completed', count: withdrawals.filter(w => w.status === 'completed').length, color: '#10b981' },
                  { label: 'Rejected', count: withdrawals.filter(w => w.status === 'rejected').length, color: '#ef4444' },
                  { label: 'Pending Amount', count: `₦${withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0).toLocaleString()}`, color: '#3b82f6' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="card-sm">
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <input className="input-dark" placeholder="Search by seller name, email or reference…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {withdrawals.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48 }}>
                    <Download size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ color: 'var(--text-muted)' }}>No withdrawal requests</div>
                  </div>
                ) : withdrawals.filter(w => w.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) || w.sellerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || w.reference?.toLowerCase().includes(searchTerm.toLowerCase())).map(withdrawal => (
                  <div key={withdrawal.id} className="withdrawal-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{withdrawal.sellerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{withdrawal.sellerEmail}</div>
                      </div>
                      <span className={`pill ${getStatusPill(withdrawal.status)}`}><span className="pill-dot" />{withdrawal.status}</span>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>₦{withdrawal.amount?.toLocaleString()}</span>
                    </div>
                    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Bank Details</div>
                      {[
                        { label: 'Account Name', value: withdrawal.bankDetails?.accountName },
                        { label: 'Account No.', value: withdrawal.bankDetails?.accountNumber },
                        { label: 'Bank', value: withdrawal.bankDetails?.bankName },
                        { label: 'Code', value: withdrawal.bankDetails?.bankCode },
                      ].filter(r => r.value).map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setSelectedSeller(withdrawal.sellerId); fetchSellerFullDetails(withdrawal.sellerId); }}
                      className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}><Eye size={12} />View Seller Account</button>
                    {withdrawal.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setConfirmedWithdrawal(withdrawal); setShowConfirmModal(true); }}
                          disabled={processingWithdrawalId === withdrawal.id} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                          {processingWithdrawalId === withdrawal.id ? '…' : <><Check size={12} />Approve</>}
                        </button>
                        <button onClick={() => rejectWithdrawal(withdrawal.id, withdrawal.sellerId, withdrawal.amount)}
                          disabled={processingWithdrawalId === withdrawal.id} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                          <X size={12} />Reject
                        </button>
                      </div>
                    )}
                    {withdrawal.status === 'completed' && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#34d399' }}>
                        ✅ Processed · Ref: {withdrawal.flutterwaveReference}
                      </div>
                    )}
                    {withdrawal.status === 'rejected' && withdrawal.adminNote && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
                        ❌ {withdrawal.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCHOOLS ───────────────────────────────────────────────── */}
          {activeSection === 'schools' && (
            <div>
              <div className="section-header"><div className="section-title"><Building size={18} />School Applications</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[{ label: 'Pending', count: schoolApplications.filter(s => s.status === 'pending').length, color: '#f59e0b' }, { label: 'Approved', count: schoolApplications.filter(s => s.status === 'approved').length, color: '#10b981' }, { label: 'Rejected', count: schoolApplications.filter(s => s.status === 'rejected').length, color: '#ef4444' }, { label: 'Total', count: schoolApplications.length, color: '#3b82f6' }].map(({ label, count, color }) => (
                  <div key={label} className="card-sm"><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {schoolApplications.map(school => (
                  <div key={school.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{school.schoolName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{school.schoolType}</div></div>
                      <span className={`pill ${getStatusPill(school.status)}`}><span className="pill-dot" />{school.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                      {[{ icon: MapPin, text: `${school.state}, ${school.country}` }, { icon: Mail, text: school.email }, { icon: Phone, text: school.phone }, { icon: User, text: school.principalName }].filter(r => r.text).map(({ icon: Icon, text }) => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)' }}><Icon size={11} />{text}</div>
                      ))}
                    </div>
                    {school.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => updateSchoolApplicationStatus(school.id, 'approved')} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}><Check size={12} />Approve</button>
                        <button onClick={() => updateSchoolApplicationStatus(school.id, 'rejected')} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}><X size={12} />Reject</button>
                      </div>
                    )}
                    {school.status !== 'pending' && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reviewed {formatDate(school.reviewedAt)?.split(',')[0]} by {school.reviewedBy}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCHOOL DOCS ───────────────────────────────────────────── */}
          {activeSection === 'school-documents' && (
            <div>
              <div className="section-header"><div className="section-title"><FileText size={18} />School Documents</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {schoolDocuments.length === 0 ? <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No documents yet</div> :
                  schoolDocuments.map(d => (
                    <div key={d.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{d.title}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.schoolName}</div></div>
                        <span className={`pill ${getStatusPill(d.status)}`}><span className="pill-dot" />{d.status}</span>
                      </div>
                      {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}><ExternalLink size={11} />View Document</a>}
                      {d.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => updateSchoolDocumentStatus(d.id, 'approved')} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}><Check size={12} />Approve</button>
                          <button onClick={() => updateSchoolDocumentStatus(d.id, 'rejected')} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}><X size={12} />Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── FEEDBACKS ─────────────────────────────────────────────── */}
          {activeSection === 'feedbacks' && (
            <div>
              <div className="section-header"><div className="section-title"><ThumbsUp size={18} />Book Feedbacks</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {feedbacks.length === 0 ? <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No feedbacks yet</div> :
                  feedbacks.map(fb => (
                    <div key={fb.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fb.bookTitle || 'Unknown Book'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{fb.userName || 'Anonymous'} · {fb.userEmail}</div>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fb.createdAt instanceof Date ? fb.createdAt.toLocaleDateString() : ''}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                        {fb.feedback || '(No text)'}
                      </div>
                      <button onClick={() => deleteFeedback(fb.id)} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}><Trash2 size={12} />Delete</button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── ARTICLE FEEDBACKS ─────────────────────────────────────── */}
          {activeSection === 'article-feedbacks' && (
            <div>
              <div className="section-header">
                <div className="section-title"><Star size={18} />Help Center Feedback</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="pill pill-success"><span className="pill-dot" />{articleFeedbacks.filter(f => f.helpful).length} helpful</span>
                  <span className="pill pill-danger"><span className="pill-dot" />{articleFeedbacks.filter(f => !f.helpful).length} not helpful</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {articleFeedbacks.map(fb => (
                  <div key={fb.id} className="card" style={{ borderLeft: `3px solid ${fb.helpful ? '#10b981' : '#ef4444'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fb.title || 'Unknown Article'}</div>
                        <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>/{fb.slug}</div>
                      </div>
                      <span className={`pill ${fb.helpful ? 'pill-success' : 'pill-danger'}`}>{fb.helpful ? '👍' : '👎'}</span>
                    </div>
                    {fb.comment && <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>"{fb.comment}"</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fb.createdAt instanceof Date ? fb.createdAt.toLocaleDateString() : ''}</span>
                      <button onClick={async () => { if (!confirm('Delete?')) return; try { await deleteDoc(doc(db, 'articleFeedback', fb.id)); setArticleFeedbacks(prev => prev.filter(f => f.id !== fb.id)); } catch (e) { alert(e.message); } }} className="icon-btn" style={{ width: 28, height: 28 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ──────────────────────────────────────────────── */}
          {activeSection === 'settings' && (
            <div>
              <div className="section-header"><div className="section-title"><Settings size={18} />Fee Settings</div></div>
              <div className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} color="#34d399" /></div>
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Platform Fee Payouts</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collect ₦50 transfer fees and send to Flutterwave</div></div>
                </div>
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 16, marginTop: 12 }}>
                  <PlatformFeeSection user={user} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ MODALS ══════════ */}
      <BookApprovalModal isOpen={showModal && modalType === 'advertisement'} onClose={closeModal} item={selectedItem} onApprove={(item) => updateAdvertisementStatus(item.id, 'approved', item)} onReject={(item, reason) => updateAdvertisementStatus(item.id, 'rejected', item)} checkPdfDuplicate={checkPdfDuplicate} formatDate={formatDate} getStatusColor={getStatusPill} />
      <ReplyModal isOpen={showModal && modalType === 'reply'} onClose={closeModal} item={selectedItem} replyMessage={replyMessage} setReplyMessage={setReplyMessage} onSend={sendEmailReply} sending={sending} />
      <TransactionModal isOpen={showModal && modalType === 'transaction'} onClose={closeModal} item={selectedItem} formatDate={formatDate} getStatusColor={getStatusPill} />
      <UserModal isOpen={showModal && modalType === 'user'} onClose={closeModal} item={selectedItem} formatDate={formatDate} getStatusColor={getStatusPill} onUpdateStatus={updateUserStatus} onDelete={deleteUserAccount} />

      {/* Admin PIN Modal */}
      {showAdminPinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, width: '100%', maxWidth: 360, overflow: 'hidden' }}>
            <div style={{ background: 'var(--surface)', padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Lock size={20} color="#60a5fa" /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Admin Authorization</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Enter PIN to approve ₦{pendingWithdrawal?.amount?.toLocaleString()}</div>
            </div>
            <div style={{ padding: 20 }}>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN" autoFocus value={adminPinValue} onChange={e => setAdminPinValue(e.target.value)} className="input-dark" style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 8, marginBottom: 12 }} />
              <button onClick={() => { const entered = adminPinValue; const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN; if (!PIN) { alert('PIN not configured'); return; } if (entered !== PIN) { alert('❌ Incorrect PIN'); return; } setShowAdminPinModal(false); setAdminPinValue(''); setSkipConfirm(true); approveWithdrawal(pendingWithdrawal); setPendingWithdrawal(null); }} className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>Confirm Approval</button>
              <button onClick={() => { setShowAdminPinModal(false); setPendingWithdrawal(null); setAdminPinValue(''); }} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmedWithdrawal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, width: '100%', maxWidth: 420 }}>
            <div style={{ background: 'var(--surface)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color="#fbbf24" /></div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Withdrawal</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Review before approving</div></div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px', textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amount</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399' }}>₦{confirmedWithdrawal.amount?.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                {[{ label: 'Seller', value: confirmedWithdrawal.sellerName }, { label: 'Bank', value: confirmedWithdrawal.bankDetails?.bankName }, { label: 'Account', value: confirmedWithdrawal.bankDetails?.accountNumber }, { label: 'Name', value: confirmedWithdrawal.bankDetails?.accountName }].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#fbbf24', marginBottom: 14, display: 'flex', gap: 8 }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />Irreversible — double-check all details above.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowConfirmModal(false); setConfirmedWithdrawal(null); }} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={() => { setShowConfirmModal(false); setPendingWithdrawal(confirmedWithdrawal); setShowAdminPinModal(true); setConfirmedWithdrawal(null); }} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}><Check size={13} />Proceed to PIN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {withdrawalSuccessData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, width: '100%', maxWidth: 360 }}>
            <div style={{ background: 'var(--surface)', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Check size={24} color="#34d399" /></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Payment Sent!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Processed via Flutterwave</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 16 }}>
                {[{ label: 'Amount', value: `₦${Number(withdrawalSuccessData.amount).toLocaleString()}`, color: '#34d399' }, { label: 'Seller', value: withdrawalSuccessData.sellerName }, { label: 'Bank', value: withdrawalSuccessData.bankName }, { label: 'Account', value: withdrawalSuccessData.accountNumber }, { label: 'Ref', value: withdrawalSuccessData.reference }].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: color || 'var(--text-primary)', fontWeight: 600, fontFamily: label === 'Account' || label === 'Ref' ? 'monospace' : 'inherit', fontSize: label === 'Ref' ? 11 : 13 }}>{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setWithdrawalSuccessData(null)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Details Modal */}
      {selectedSeller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--surface)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Seller Account</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Full financial overview</div></div>
              <button onClick={() => { setSelectedSeller(null); setSellerDetails(null); }} className="icon-btn"><X size={15} /></button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {loadingSellerDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 32, height: 32, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
              ) : sellerDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Balance', value: `₦${(sellerDetails.seller?.accountBalance || 0).toLocaleString()}`, color: '#34d399' },
                      { label: 'Withdrawn', value: `₦${sellerDetails.stats.totalWithdrawn.toLocaleString()}`, color: '#f87171' },
                      { label: 'Total Earned', value: `₦${sellerDetails.stats.totalEarned.toLocaleString()}`, color: '#60a5fa' },
                      { label: 'Transferred', value: `₦${sellerDetails.stats.totalTransferred.toLocaleString()}`, color: '#fbbf24' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="card-sm"><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div></div>
                    ))}
                  </div>
                  {[
                    { title: 'Sales', icon: DollarSign, color: '#34d399', items: sellerDetails.sales, render: s => ({ left: s.bookTitle || 'Unknown', right: `+₦${(s.sellerEarnings || s.amount || 0).toLocaleString()}`, sub: formatDate(s.createdAt) }) },
                    { title: 'Transfers', icon: Send, color: '#60a5fa', items: sellerDetails.transfers, render: t => ({ left: `To: ${t.recipientName || 'Unknown'}`, right: `-₦${(t.totalDeducted || t.amount || 0).toLocaleString()}`, sub: formatDate(t.createdAt) }) },
                    { title: 'Withdrawals', icon: Download, color: '#f87171', items: sellerDetails.withdrawals, render: w => ({ left: `₦${(w.amount || 0).toLocaleString()}`, right: w.status, sub: formatDate(w.requestedAt) }) },
                  ].map(({ title, icon: Icon, color, items, render }) => (
                    <div key={title}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} color={color} />{title} ({items.length})</div>
                      {items.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>None yet</div> : (
                        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {items.map((item, i) => {
                            const { left, right, sub } = render(item); return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                                <div><div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{left}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sub}</div></div>
                                <span style={{ color, fontWeight: 700 }}>{right}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Could not load details.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}