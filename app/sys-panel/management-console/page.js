"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import {
  FileText, Trash2, Check, X, Search, Calendar, User, Shield,
  Eye, Mail, MessageSquare, AlertCircle, TrendingUp,
  DollarSign, Users, BookOpen, ChevronRight, Send, RefreshCw, BarChart3,
  Settings, Flag, XCircle, AlertTriangle, UserX, Lock, ExternalLink,
  Download, Book, Phone, MapPin, CreditCard, Building,
  Clock, ThumbsUp
} from 'lucide-react';
import { BookApprovalModal, ReplyModal, TransactionModal, UserModal } from '@/components/ApprovalModal';

// ── Platform Fee Section Component ──────────────────────────────────────────
function PlatformFeeSection({ user }) {
  const [pendingFees, setPendingFees] = useState([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [payingOut, setPayingOut] = useState(false);
  const [lastPayout, setLastPayout] = useState(null);

  useEffect(() => {
    loadPendingFees();
    loadLastPayout();
  }, []);

  const loadPendingFees = async () => {
    try {
      setLoadingFees(true);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'platformFees'),
        where('disbursedToFlutterwave', '==', false)
      );
      const snap = await getDocs(q);
      setPendingFees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading fees:', err);
    } finally {
      setLoadingFees(false);
    }
  };

  const loadLastPayout = async () => {
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'payoutLogs'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastPayout({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    } catch (err) {
      console.error('Error loading last payout:', err);
    }
  };

  const totalPending = pendingFees.reduce((sum, f) => sum + (f.fee || 0), 0);

  const triggerPayout = async () => {
    if (totalPending < 100) {
      alert(`Not enough fees to disburse. Current pending: ₦${totalPending}. Minimum is ₦100.`);
      return;
    }

    if (!confirm(`Disburse ₦${totalPending.toLocaleString()} from ${pendingFees.length} fees to your Flutterwave account?`)) return;

    setPayingOut(true);
    try {
      const res = await fetch('https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/manualFeePayout', {
        headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'YOUR_ADMIN_SECRET' }
      });
      const data = await res.json();

      if (data.message?.includes('success') || data.total > 0) {
        alert(`✅ Payout Successful!\n\nAmount: ₦${data.total?.toLocaleString()}\nFees collected: ${data.feesCount}\nReference: ${data.reference}`);
        await loadPendingFees();
        await loadLastPayout();
      } else {
        alert(`ℹ️ ${data.message || 'No fees to disburse'}`);
      }
    } catch (err) {
      console.error('Payout error:', err);
      alert(`❌ Payout failed: ${err.message}`);
    } finally {
      setPayingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live fee stats */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {loadingFees ? (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
            Loading pending fees...
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{pendingFees.length}</span> pending fees
                totalling <span className="font-bold text-green-600">₦{totalPending.toLocaleString()}</span>
              </p>
              {lastPayout && (
                <p className="text-xs text-gray-400 mt-1">
                  Last payout: ₦{lastPayout.totalAmount?.toLocaleString()} on{' '}
                  {lastPayout.createdAt?.toDate?.().toLocaleDateString('en-NG', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </div>
            <button
              onClick={loadPendingFees}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Payout button */}
      <button
        onClick={triggerPayout}
        disabled={payingOut || loadingFees || totalPending < 100}
        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {payingOut ? (
          <><div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> Processing Payout...</>
        ) : (
          <><DollarSign className="w-5 h-5" /> Withdraw ₦{totalPending.toLocaleString()} Platform Fees to Flutterwave</>
        )}
      </button>

      {totalPending < 100 && !loadingFees && (
        <p className="text-xs text-center text-gray-400">
          Minimum ₦100 required to disburse. Keep collecting fees!
        </p>
      )}
    </div>
  );
}

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
  const [pdfViewMode, setPdfViewMode] = useState('embed'); // 'embed' or 'fullscreen'
  const [schoolApplications, setSchoolApplications] = useState([]);
  const [schoolDocuments, setSchoolDocuments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkAdminStatus(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setCheckingAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);


const checkAdminStatus = async (currentUser) => {
  try {
    setCheckingAdmin(true);
    
    // Primary check: Firestore admin flag
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check Firestore first
      if (userData.role === 'admin' || userData.isAdmin === true) {
        setIsAdmin(true);
        await fetchAllData();
        return;
      }
    }
    
    // Fallback check: Environment variable (for emergency access)
    if (ADMIN_EMAILS.includes(currentUser.email)) {
      // Log this access for security monitoring
      console.warn('⚠️ Admin access via environment variable:', currentUser.email);
      
      // Optionally, automatically set isAdmin in Firestore
      await updateDoc(userDocRef, {
        isAdmin: true,
        role: 'admin',
        adminAccessGranted: serverTimestamp()
      });
      
      setIsAdmin(true);
      await fetchAllData();
      return;
    }
    
    // No admin access
    setIsAdmin(false);
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    setIsAdmin(false);
  } finally {
    setCheckingAdmin(false);
  }
};

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdvertisements(),
        fetchSupportTickets(),
        fetchBookReports(),
        fetchTransactions(),
        fetchUsers(),
        fetchWithdrawals(), 
        fetchSchoolApplications(), 
        fetchSchoolDocuments(),
        fetchFeedbacks(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolApplications = async () => {
    try {
      const q = query(collection(db, 'schoolApplications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setSchoolApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching school applications:', error);
    }
  };

  const fetchSchoolDocuments = async () => {
    try {
      const q = query(collection(db, 'schoolDocuments'), orderBy('uploadDate', 'desc'));
      const snapshot = await getDocs(q);
      setSchoolDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching school documents:', error);
    }
  };

  const updateSchoolApplicationStatus = async (schoolId, status) => {
  if (!confirm(`Are you sure you want to ${status} this school application?`)) return;
  
  try {
    await updateDoc(doc(db, 'schoolApplications', schoolId), {
      status: status,
      verifiedSchool: status === 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: user.email
    });
    
    // Send notification to school
    const school = schoolApplications.find(s => s.id === schoolId);
    if (school) {
      await addDoc(collection(db, 'notifications'), {
        userId: school.userId || school.email,
        type: status === 'approved' ? 'school_approved' : 'school_rejected',
        title: status === 'approved' ? 'School Application Approved ✅' : 'School Application Rejected ❌',
        message: status === 'approved' 
          ? `Congratulations! ${school.schoolName} has been approved. You can now access your school dashboard and start uploading documents.`
          : `Your school application for ${school.schoolName} has been rejected. Please contact support for more information.`,
        createdAt: serverTimestamp(),
        read: false
      });
    }
    
    alert(`School ${status} successfully!`);
    await fetchSchoolApplications();
  } catch (error) {
    console.error('Error updating school application:', error);
    alert('Failed to update school application');
  }
};

const updateSchoolDocumentStatus = async (docId, status) => {
  if (!confirm(`Are you sure you want to ${status} this document?`)) return;
  
  try {
    await updateDoc(doc(db, 'schoolDocuments', docId), {
      status: status,
      verified: status === 'approved',
      approvedDate: status === 'approved' ? serverTimestamp() : null,
      approvedBy: user.email
    });
    
    // Update school's total document count if approved
    const document = schoolDocuments.find(d => d.id === docId);
    if (document && status === 'approved') {
      const schoolQuery = query(
        collection(db, 'schoolApplications'),
        where('schoolId', '==', document.schoolId)
      );
      const schoolSnap = await getDocs(schoolQuery);
      
      if (!schoolSnap.empty) {
        const schoolDocRef = doc(db, 'schoolApplications', schoolSnap.docs[0].id);
        const currentTotal = schoolSnap.docs[0].data().totalDocuments || 0;
        await updateDoc(schoolDocRef, {
          totalDocuments: currentTotal + 1
        });
      }
    }
    
    alert(`Document ${status} successfully!`);
    await fetchSchoolDocuments();
  } catch (error) {
    console.error('Error updating document:', error);
    alert('Failed to update document');
  }
  };
  
  const fetchAdvertisements = async () => {
    const q = query(collection(db, 'advertMyBook'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setAdvertisements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchSupportTickets = async () => {
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setSupportTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchBookReports = async () => {
    const q = query(collection(db, 'bookReports'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setBookReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchTransactions = async () => {
    const [txnSnap, transferSnap] = await Promise.all([
      getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'transfers'), orderBy('createdAt', 'desc')))
    ]);
    const txns = txnSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'sale' }));
    const transfers = transferSnap.docs.map(d => ({
      id: d.id, ...d.data(),
      source: 'transfer',
      bookTitle: `Transfer → ${d.data().recipientName || 'Unknown'}`,
      buyerEmail: d.data().senderName || d.data().senderId,
      sellerName: d.data().recipientName,
      amount: d.data().totalDeducted || d.data().amount,
    }));
    const all = [...txns, ...transfers].sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return bDate - aDate;
    });
    setTransactions(all);
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchWithdrawals = async () => {
    try {
      const q = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'));
      const snapshot = await getDocs(q);
      setWithdrawals(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAtDate: doc.data().requestedAt?.toDate() || new Date()
      })));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const checkPdfDuplicate = async (pdfUrl) => {
  if (!pdfUrl) return false;
  setCheckingDuplicate(true);
  try {
    // Check exact URL match
    const q = query(
      collection(db, 'advertMyBook'), 
      where('pdfUrl', '==', pdfUrl), 
      where('status', '==', 'approved')
    );
    const snapshot = await getDocs(q);
    
    // If it's a Firebase Storage URL, it's a direct upload - less strict duplicate check
    if (pdfUrl.includes('firebasestorage.googleapis.com')) {
      // For direct uploads, only flag if exact same file URL exists
      return !snapshot.empty;
    }
    
    // For Google Drive, check more strictly
    if (pdfUrl.includes('drive.google.com')) {
      // Extract Drive file ID and check if any approved book has same file ID
      const match = pdfUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})|id=([\w-]{25,})/);
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        // Check all approved books for this file ID
        const allApprovedQuery = query(
          collection(db, 'advertMyBook'),
          where('status', '==', 'approved')
        );
        const allApproved = await getDocs(allApprovedQuery);
        
        for (const doc of allApproved.docs) {
          const data = doc.data();
          if (data.driveFileId === fileId || 
              data.pdfUrl?.includes(fileId) || 
              data.pdfLink?.includes(fileId)) {
            return true; // Duplicate found
          }
        }
      }
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  } finally {
    setCheckingDuplicate(false);
  }
};

  const updateAdvertisementStatus = async (id, status, ad) => {
  if (status === 'approved') {
    // Check for duplicates
    const isDuplicate = await checkPdfDuplicate(ad.pdfUrl || ad.pdfLink);
    if (isDuplicate) {
      alert('⚠️ This file already exists in the database. Cannot approve duplicate.');
      return;
    }
  }
  
  await updateDoc(doc(db, 'advertMyBook', id), { 
    status, 
    reviewedAt: serverTimestamp(),
    reviewedBy: user.email // Add this for tracking
  });
  
  setAdvertisements(advertisements.map(a => a.id === id ? { ...a, status } : a));
  alert(`✅ Book ${status} successfully`);
  setShowModal(false);
};

  const updateTicketStatus = async (id, status) => {
    await updateDoc(doc(db, 'supportTickets', id), { status, resolvedAt: serverTimestamp() });
    setSupportTickets(supportTickets.map(t => t.id === id ? { ...t, status } : t));
    alert(`Ticket ${status}`);
  };

  const updateReportStatus = async (id, status) => {
    await updateDoc(doc(db, 'bookReports', id), { status, resolvedAt: serverTimestamp() });
    setBookReports(bookReports.map(r => r.id === id ? { ...r, status } : r));
    alert(`Report ${status}`);
  };

  const updateUserStatus = async (userId, status) => {
    if (!confirm(`Are you sure you want to set this user to ${status}?`)) return;
    await updateDoc(doc(db, 'users', userId), { accountStatus: status, updatedAt: serverTimestamp() });
    fetchUsers();
    alert(`User account set to ${status}`);
  };

  const deleteUserAccount = async (userId) => {
    if (!confirm('Are you sure you want to DELETE this user account? This action cannot be undone!')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
      alert('User account deleted successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user account');
    }
  };

  //  FLUTTERWAVE TRANSFER FUNCTION
  const processFlutterwaveTransfer = async (withdrawal) => {
    try {
      console.log(' Initiating transfer via API route...');

      const response = await fetch('/api/flutterwave-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ withdrawal })
      });

      const result = await response.json();

      console.log(' API response:', result);

      if (result.success) {
        return {
          success: true,
          transferId: result.transferId,
          reference: result.reference,
          status: result.status
        };
      } else {
        throw new Error(result.error || 'Transfer failed');
      }

    } catch (error) {
      console.error(' Transfer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process transfer'
      };
    }
  };

  //  APPROVE WITHDRAWAL FUNCTION
  const approveWithdrawal = async (withdrawal) => {
    // ✅ VALIDATION: Check if bank details exist
    if (!withdrawal.bankDetails) {
      alert('❌ Error: This withdrawal request is missing bank details.\n\nThis usually happens for old requests created before bank details were added.\n\nPlease ask the seller to submit a new withdrawal request.');
      return;
    }

    // ✅ VALIDATION: Check if bank code exists
    if (!withdrawal.bankDetails.bankCode) {
      alert('❌ Error: Bank code is missing!\n\nThis withdrawal was created before bank codes were added to the system.\n\nSolution:\n1. Ask the seller to cancel this request\n2. Have them submit a new withdrawal request\n3. The new request will include the bank code');
      return;
    }

    // ✅ VALIDATION: Check required fields
    if (!withdrawal.bankDetails.accountNumber || !withdrawal.bankDetails.accountName) {
      alert('❌ Error: Incomplete bank details. Account number or name is missing.');
      return;
    }

    // Show confirmation with all details
    const confirmMessage = `
⚠️ CONFIRM WITHDRAWAL APPROVAL

Amount: ₦${withdrawal.amount.toLocaleString()}
Seller: ${withdrawal.sellerName}

Bank Details:
• Bank: ${withdrawal.bankDetails.bankName}
• Bank Code: ${withdrawal.bankDetails.bankCode}
• Account: ${withdrawal.bankDetails.accountNumber}
• Account Name: ${withdrawal.bankDetails.accountName}

This will process the payment via Flutterwave.

Click OK to approve or Cancel to go back.
  `.trim();

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingWithdrawalId(true);

      console.log('🔄 Starting withdrawal approval process...');
      console.log('📋 Withdrawal details:', {
        id: withdrawal.id,
        amount: withdrawal.amount,
        seller: withdrawal.sellerName,
        bankCode: withdrawal.bankDetails.bankCode,
        accountNumber: withdrawal.bankDetails.accountNumber
      });

      // Step 1: Process Flutterwave transfer
      const transferResult = await processFlutterwaveTransfer(withdrawal);

      console.log('📡 Transfer result:', transferResult);

      if (!transferResult.success) {
        console.error('❌ Transfer failed:', transferResult);

        // Enhanced error messages
        let errorMessage = transferResult.error || 'Unknown error occurred';
        let helpText = '';

        // Specific error guidance
        if (errorMessage.toLowerCase().includes('insufficient')) {
          helpText = '\n\n💡 Solution:\n1. Go to dashboard.flutterwave.com\n2. Click "Transfers" in the sidebar\n3. Fund your wallet with at least ₦' + withdrawal.amount.toLocaleString();
        } else if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('key')) {
          helpText = '\n\n💡 Solution:\n1. Check your .env.local file\n2. Make sure FLUTTERWAVE_SECRET_KEY starts with FLWSECK-\n3. Copy the SECRET KEY from Flutterwave dashboard\n4. Restart your dev server';
        } else if (errorMessage.toLowerCase().includes('bank code')) {
          helpText = '\n\n💡 Solution:\n1. Verify bank code: ' + withdrawal.bankDetails.bankCode + '\n2. Check if this is the correct code for ' + withdrawal.bankDetails.bankName + '\n3. You can find correct codes at https://developer.flutterwave.com/docs/resources/banks';
        } else if (errorMessage.toLowerCase().includes('account')) {
          helpText = '\n\n💡 Solution:\n1. Verify account number: ' + withdrawal.bankDetails.accountNumber + '\n2. Confirm it matches ' + withdrawal.bankDetails.bankName + '\n3. Check account name: ' + withdrawal.bankDetails.accountName;
        } else if (errorMessage.includes('HTML') || errorMessage.includes('JSON')) {
          helpText = '\n\n💡 Solution:\n1. Your API key is invalid or wrong\n2. Go to https://dashboard.flutterwave.com/settings/apis\n3. Copy your SECRET KEY (starts with FLWSECK-)\n4. Update .env.local\n5. Restart server: npm run dev';
        }

        alert(`❌ Transfer Failed\n\n${errorMessage}${helpText}`);
        return;
      }

      console.log('✅ Transfer successful!');

      // Step 2: Update withdrawal status in Firestore
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'completed',
        processedAt: serverTimestamp(),
        flutterwaveTransferId: transferResult.transferId,
        flutterwaveReference: transferResult.reference,
        adminNote: 'Approved and processed via Flutterwave',
        processedBy: user.email
      });

      console.log('✅ Withdrawal status updated in Firestore');

      // Step 3: Update seller balance
      const sellerDocRef = doc(db, 'sellers', withdrawal.sellerId);
      const sellerDoc = await getDoc(sellerDocRef);

      if (sellerDoc.exists()) {
        const currentBalance = sellerDoc.data().accountBalance || 0;
        const newBalance = currentBalance - withdrawal.amount;

        await updateDoc(sellerDocRef, {
          accountBalance: newBalance,
          totalWithdrawn: (sellerDoc.data().totalWithdrawn || 0) + withdrawal.amount,
          lastWithdrawalDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('✅ Seller balance updated:', {
          oldBalance: currentBalance,
          newBalance: newBalance,
          withdrawn: withdrawal.amount
        });
      }

      // Step 4: Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: withdrawal.sellerId,
        type: 'withdrawal_approved',
        title: 'Withdrawal Approved ✅',
        message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been approved and processed. The funds should arrive in your bank account within 24 hours.\n\nBank: ${withdrawal.bankDetails.bankName}\nAccount: ${withdrawal.bankDetails.accountNumber}\n\nFlutterwave Reference: ${transferResult.reference}`,
        reference: withdrawal.reference,
        createdAt: serverTimestamp(),
        read: false
      });

      console.log('✅ Notification sent to seller');

      // Success message
      alert(`✅ Withdrawal Approved Successfully!

        Amount: ₦${withdrawal.amount.toLocaleString()}
        Seller: ${withdrawal.sellerName}
        Bank: ${withdrawal.bankDetails.bankName}
        Account: ${withdrawal.bankDetails.accountNumber}

        Flutterwave Transfer ID: ${transferResult.transferId}
        Reference: ${transferResult.reference}

        The seller has been notified via email and in-app notification.`);

      // Refresh withdrawal list
      await fetchWithdrawals();

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert(`❌ Failed to approve withdrawal\n\nError: ${error.message}\n\nPlease check the console for more details.`);
    } finally {
      setProcessingWithdrawalId(false);
    }
  };

  const fetchFeedbacks = async () => {
  try {
    const q = query(collection(db, 'bookFeedbacks'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const feedbackList = await Promise.all(
      snapshot.docs.map(async (feedbackDoc) => {
        const fbData = feedbackDoc.data();
        
        // If bookTitle is missing, fetch it
        if (!fbData.bookTitle && fbData.bookId) {
          try {
            const bookId = fbData.bookId.replace('firestore-', '');
            const bookDoc = await getDoc(doc(db, 'advertMyBook', bookId));
            if (bookDoc.exists()) {
              fbData.bookTitle = bookDoc.data().bookTitle || bookDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching book title:', error);
          }
        }
        
        return {
          id: feedbackDoc.id,
          ...fbData,
          createdAt: fbData.createdAt?.toDate() || new Date()
        };
      })
    );
    
    setFeedbacks(feedbackList);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
  }
};

const deleteFeedback = async (feedbackId) => {
  if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) return;
  
  try {
    await deleteDoc(doc(db, 'bookFeedbacks', feedbackId));
    alert('✅ Feedback deleted successfully');
    await fetchFeedbacks();
  } catch (error) {
    console.error('Error deleting feedback:', error);
    alert('❌ Failed to delete feedback');
  }
};

  //  REJECT WITHDRAWAL FUNCTION
  const rejectWithdrawal = async (withdrawalId, sellerId, amount) => {
    const reason = prompt('Enter rejection reason (will be shown to seller):');

    if (!reason || reason.trim() === '') {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm(`Reject withdrawal of ₦${amount.toLocaleString()}?`)) return;

    try {
      setProcessingWithdrawalId(true);

      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'rejected',
        processedAt: serverTimestamp(),
        adminNote: reason,
        processedBy: user.email
      });

      // Send notification to seller
      await addDoc(collection(db, 'notifications'), {
        userId: sellerId,
        type: 'withdrawal_rejected',
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal request for ₦${amount.toLocaleString()} was rejected.\n\nReason: ${reason}\n\nPlease contact support if you have questions.`,
        createdAt: serverTimestamp(),
        read: false
      });

      alert(' Withdrawal rejected. The seller has been notified.');
      await fetchWithdrawals();

    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert(` Failed to reject withdrawal: ${error.message}`);
    } finally {
      setProcessingWithdrawalId(false);
    }
  };

  const sendEmailReply = async () => {
    if (!replyMessage.trim() || !selectedItem) {
      alert('Please write a message');
      return;
    }

    setSending(true);

    try {
      const replyData = {
        to: selectedItem.email || selectedItem.reporterEmail,
        subject: `Re: ${selectedItem.subject || selectedItem.reason || 'Your inquiry'}`,
        message: replyMessage,
        from: user.email,
        sentAt: serverTimestamp(),
        originalTicketId: selectedItem.id,
        type: activeSection
      };

      await addDoc(collection(db, 'adminReplies'), replyData);

      const collectionName = activeSection === 'support' ? 'supportTickets' : 'bookReports';

      await updateDoc(doc(db, collectionName, selectedItem.id), {
        adminResponse: replyMessage,
        status: 'resolved',
        resolvedAt: serverTimestamp()
      });

      alert('Reply sent successfully!');
      setShowModal(false);
      setReplyMessage('');
      setSelectedItem(null);

      if (activeSection === 'support') {
        await fetchSupportTickets();
      } else {
        await fetchBookReports();
      }

    } catch (error) {
      console.error('Error sending reply:', error);
      alert(`Failed to send reply: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const openModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setPdfViewMode('embed');
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
    setReplyMessage('');
    setPdfUrl('');
    setPdfViewMode('embed');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'resolved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalRevenue: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalTransactions: transactions.length,
    totalTransfers: transactions.filter(t => t.source === 'transfer').length,
    totalUsers: users.length,
    totalFeedbacks: feedbacks.length,
    totalBooks: advertisements.length,
    pendingAds: advertisements.filter(a => a.status === 'pending').length,
    openTickets: supportTickets.filter(t => t.status === 'open').length,
    pendingReports: bookReports.filter(r => r.status === 'pending').length,
    pendingSchools: schoolApplications.filter(s => s.status === 'pending').length, // ✅ ADD
    pendingSchoolDocs: schoolDocuments.filter(d => d.status === 'pending').length // ✅ ADD
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mx-auto"></div>
          <p className="mt-4 text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <a href="/home" className="inline-block bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-900">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-950">
      <header className="bg-blue-950 text-white p-4 sticky top-0 z-50 shadow-lg border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">LAN Library Admin Panel</h1>
            <p className="text-sm text-blue-300">{user.email}</p>
          </div>
          <button onClick={fetchAllData} className="flex items-center gap-2 bg-white text-blue-950 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'advertisements', icon: BookOpen, label: 'Books', badge: stats.pendingAds },
            { id: 'withdrawals', icon: Download, label: 'Withdrawals', badge: withdrawals.filter(w => w.status === 'pending').length }, // ✅ ADDED
            { id: 'support', icon: MessageSquare, label: 'Support', badge: stats.openTickets },
            { id: 'reports', icon: Flag, label: 'Reports', badge: stats.pendingReports },
            { id: 'transactions', icon: DollarSign, label: 'Sales' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'schools', icon: Building, label: 'Schools', badge: stats.pendingSchools },
            { id: 'school-documents', icon: FileText, label: 'School Docs', badge: stats.pendingSchoolDocs },
            { id: 'feedbacks', icon: ThumbsUp, label: 'Feedbacks', badge: feedbacks.length },
            { id: 'settings', icon: Settings, label: 'Settings' }

          ].map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => { setActiveSection(id); setSearchTerm(''); }}
              className={`p-4 rounded-lg transition-all ${activeSection === id ? 'bg-white text-blue-950 shadow-lg' : 'bg-blue-900 text-white hover:bg-blue-800'}`}>
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold">{label}</span>
              {badge > 0 && <span className="block text-xs mt-1 bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5">{badge}</span>}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'green' },
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
                { label: 'Total Books', value: stats.totalBooks, icon: BookOpen, color: 'purple' },
                { label: 'Transactions', value: `${stats.totalTransactions} total`, icon: TrendingUp, color: 'orange' }              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{label}</p>
                      <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                    </div>
                    <Icon className={`w-12 h-12 text-${color}-600 opacity-20`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Pending Book Approvals', count: stats.pendingAds, section: 'advertisements', color: 'yellow', bg: 'yellow-50', border: 'yellow-200' },
                { title: 'Open Support Tickets', count: stats.openTickets, section: 'support', color: 'red', bg: 'red-50', border: 'red-200' },
                { title: 'Pending Reports', count: stats.pendingReports, section: 'reports', color: 'orange', bg: 'orange-50', border: 'orange-200' },
                { title: 'Pending School Applications', count: stats.pendingSchools, section: 'schools', color: 'purple', bg: 'purple-50', border: 'purple-200' },
                { title: 'Pending School Documents', count: stats.pendingSchoolDocs, section: 'school-documents', color: 'indigo', bg: 'indigo-50', border: 'indigo-200' },
              ].map(({ title, count, section, color, bg, border }) => (
                <div key={section} className={`bg-${bg} border border-${border} rounded-lg p-6`}>
                  <h3 className={`font-bold text-${color}-900 mb-2`}>{title}</h3>
                  <p className={`text-3xl font-bold text-${color}-600 mb-4`}>{count}</p>
                  <button onClick={() => { setActiveSection(section); setSearchTerm(''); }}
                    className={`text-${color}-800 hover:underline text-sm flex items-center gap-1`}>
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => openModal('transaction', txn)}>
                    <div>
                      <p className="font-semibold text-gray-900">{txn.bookTitle}</p>
                      <p className="text-sm text-gray-600">{txn.buyerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₦{txn.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'advertisements' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Book Advertisements</h2>
            <div className="bg-white rounded-lg shadow-sm p-4 text-blue-950">
              <input type="text" placeholder="Search books..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisements.filter(ad => ad.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase())).map((ad) => (
                <div key={ad.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{ad.bookTitle}</h3>
                      <p className="text-sm text-gray-600">by {ad.author}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ad.status)}`}>{ad.status}</span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 truncate">{ad.sellerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-green-600">₦{ad.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Book className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 capitalize">{ad.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-xs">{formatDate(ad.createdAt)}</span>
                    </div>
                    {ad.pages && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{ad.pages} pages</span>
                      </div>
                    )}
                    <span className="text-gray-700 capitalize text-xl">{ad.sellerName}</span>

                  </div>

                  <button onClick={() => openModal('advertisement', ad)} className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2 font-semibold transition-colors">
                    <Eye className="w-5 h-5" />
                    Review & Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">All Transactions</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-950 text-white border-b">
                  <tr>
                    {['Book', 'Buyer', 'Seller', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{txn.bookTitle}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{txn.buyerEmail}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{txn.sellerName || txn.sellerEmail || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">₦{txn.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(txn.createdAt)}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(txn.status || 'completed')}`}>{txn.status || 'completed'}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => openModal('transaction', txn)} className="text-blue-950 hover:text-blue-700">
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">All Users <span className="text-blue-300 text-lg">({users.length})</span></h2>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <input type="text" placeholder="Search users by name, email or role..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-blue-950" />
              </div>
              <table className="w-full">
                <thead className="bg-blue-950 text-white border-b">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.filter(u =>
                    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{u.displayName || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{u.role || 'user'}</span></td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(u.accountStatus || 'active')}`}>{u.accountStatus || 'active'}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => openModal('user', u)} className="text-blue-950 hover:text-blue-700">
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'support' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <input type="text" placeholder="Search tickets..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-blue-950" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportTickets.filter(t =>
                t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.name?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((ticket) => (                <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{ticket.subject || 'No Subject'}</h3>
                      <p className="text-sm text-gray-600">{ticket.name}</p>
                      <p className="text-xs text-gray-500">{ticket.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-blue-950 mb-2">Category: {ticket.category}</p>
                  <p className="text-sm text-gray-700 mb-4">{ticket.message}</p>
                  <p className="text-xs text-gray-500 mb-4">{formatDate(ticket.createdAt)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('reply', ticket)} className="flex-1 bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-1">
                      <Mail className="w-4 h-4" />Reply
                    </button>
                    <button onClick={() => updateTicketStatus(ticket.id, 'resolved')} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Book Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{report.bookTitle}</h3>
                      <p className="text-sm text-gray-600">by {report.bookAuthor}</p>
                      <p className="text-xs text-gray-500">{report.reporterEmail}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>{report.status}</span>
                  </div>
                  <p className="text-sm font-semibold text-red-600 mb-2">{report.reason}</p>
                  <p className="text-sm text-gray-700 mb-4">{report.details}</p>
                  <p className="text-xs text-gray-500 mb-4">{formatDate(report.createdAt)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('reply', report)} className="flex-1 bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-1">
                      <Mail className="w-4 h-4" />Reply
                    </button>
                    <button onClick={() => updateReportStatus(report.id, 'resolved')} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'schools' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">School Applications</h2>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-600 font-semibold mb-2">Pending</p>
        <p className="text-3xl font-bold text-yellow-900">
          {schoolApplications.filter(s => s.status === 'pending').length}
        </p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <p className="text-green-600 font-semibold mb-2">Approved</p>
        <p className="text-3xl font-bold text-green-900">
          {schoolApplications.filter(s => s.status === 'approved').length}
        </p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 font-semibold mb-2">Rejected</p>
        <p className="text-3xl font-bold text-red-900">
          {schoolApplications.filter(s => s.status === 'rejected').length}
        </p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-600 font-semibold mb-2">Total Schools</p>
        <p className="text-3xl font-bold text-blue-900">
          {schoolApplications.length}
        </p>
      </div>
    </div>

    {/* Applications List */}
    {schoolApplications.length === 0 ? (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No School Applications</h3>
        <p className="text-gray-600">School registration applications will appear here</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schoolApplications.map((school) => (
          <div key={school.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{school.schoolName}</h3>
                <p className="text-sm text-gray-600">{school.schoolType}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(school.status)}`}>
                {school.status}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4 text-blue-950">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{school.state}, {school.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-blue-600">{school.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{school.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>{school.principalName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>Approval #: {school.approvalNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(school.createdAt)}</span>
              </div>
              {school.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <span className="text-gray-700">{school.address}</span>
                </div>
              )}
              {school.userId && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">User ID: {school.userId}</span>
                </div>
              )}
            </div>

            {/* Proof Document */}
            {school.proofDocumentUrl && (
              <div className="mb-4">
                <a
                  href={school.proofDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Proof Document
                </a>
              </div>
            )}

            {/* Actions */}
            {school.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateSchoolApplicationStatus(school.id, 'approved')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => updateSchoolApplicationStatus(school.id, 'rejected')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

            {school.status === 'approved' && (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    School approved and verified
                  </p>
                  {school.reviewedAt && (
                    <p className="text-xs text-gray-600 mt-1">
                      Approved on {formatDate(school.reviewedAt)} by {school.reviewedBy}
                    </p>
                  )}
                </div>
                <a
                  href={`/schools/${school.schoolId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900"
                >
                  View School Profile
                </a>
              </div>
            )}

            {school.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Application rejected
                </p>
                {school.reviewedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Rejected on {formatDate(school.reviewedAt)} by {school.reviewedBy}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

{activeSection === 'school-documents' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">School Documents</h2>

    {schoolDocuments.length === 0 ? (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No School Documents</h3>
        <p className="text-gray-600">Documents uploaded by schools will appear here</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schoolDocuments.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{doc.title}</h3>
                <p className="text-sm text-gray-600">{doc.schoolName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                {doc.status}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span>{doc.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span>{doc.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{doc.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{doc.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>{doc.fileSize}</span>
              </div>
              <div className="text-xs text-gray-500">
                Uploaded: {formatDate(doc.uploadDate)}
              </div>
            </div>

            {doc.fileUrl && (
              <div className="mb-4">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Document
                </a>
              </div>
            )}

            {doc.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateSchoolDocumentStatus(doc.id, 'approved')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => updateSchoolDocumentStatus(doc.id, 'rejected')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

            {doc.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Document approved and published
                </p>
                {doc.approvedDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Approved on {formatDate(doc.approvedDate)} by {doc.approvedBy}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

{activeSection === 'settings' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">Settings</h2>

    {/* Platform Fees Payout */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <DollarSign className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-gray-900">Platform Fee Payouts</h3>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Collect all accumulated ₦50 transfer fees and send them to your Flutterwave account.
      </p>

      {/* Fee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-xs font-semibold uppercase mb-1">Pending Fees</p>
          <p className="text-2xl font-bold text-green-900" id="pendingFeesCount">—</p>
          <p className="text-xs text-gray-500 mt-1">Not yet disbursed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-xs font-semibold uppercase mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900" id="pendingFeesAmount">—</p>
          <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-xs font-semibold uppercase mb-1">Fee Per Transfer</p>
          <p className="text-2xl font-bold text-gray-900">₦50</p>
          <p className="text-xs text-gray-500 mt-1">Fixed platform fee</p>
        </div>
      </div>

      <PlatformFeeSection user={user} />
    </div>
  </div>
        )}
        
{activeSection === 'feedbacks' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">User Feedbacks</h2>

    {feedbacks.length === 0 ? (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <ThumbsUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Feedbacks Yet</h3>
        <p className="text-gray-600">User feedbacks on books will appear here</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks.map((fb) => (
          <div key={fb.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Book Name: {fb.bookTitle || 'Unknown Book'}</h3>
                <p className="text-sm text-gray-600 font-bold">FeedBack Name: {fb.userName || 'Anonymous'}</p>
                <p className="text-sm text-gray-600 font-bold">Book Author: {fb.bookAuthor || 'Anonymous'}</p>
                <p className="text-xs text-gray-500 font-bold">FeedBack Email: {fb.userEmail || 'No email'}</p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(fb.createdAt)}</span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {fb.feedback || '(No feedback text provided)'}
              </p>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <p>Book ID: {fb.bookId}</p>
              {fb.userId && <p>User ID: {fb.userId}</p>}
            </div>

            <button
              onClick={() => deleteFeedback(fb.id)}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Feedback
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {activeSection === 'withdrawals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <input type="text" placeholder="Search by seller name, email or reference..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-blue-950" />
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <p className="text-yellow-600 font-semibold">Pending</p>
                </div>
                <p className="text-3xl font-bold text-yellow-900">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <p className="text-green-600 font-semibold">Completed</p>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {withdrawals.filter(w => w.status === 'completed').length}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <X className="w-6 h-6 text-red-600" />
                  <p className="text-red-600 font-semibold">Rejected</p>
                </div>
                <p className="text-3xl font-bold text-red-900">
                  {withdrawals.filter(w => w.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <p className="text-blue-600 font-semibold">Total Amount</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  ₦{withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div> 
             
          

            {/* Withdrawal List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {withdrawals.length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
                  <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Withdrawal Requests</h3>
                  <p className="text-gray-600">Withdrawal requests from sellers will appear here</p>
                </div>
              ) : (
                withdrawals.filter(w =>
                  w.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  w.sellerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  w.reference?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{withdrawal.sellerName}</h3>
                        <p className="text-sm text-gray-600">{withdrawal.sellerEmail}</p>
                        {withdrawal.sellerPhone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {withdrawal.sellerPhone}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status === 'pending' && '⏳ '}
                        {withdrawal.status === 'completed' && '✅ '}
                        {withdrawal.status === 'rejected' && '❌ '}
                        {withdrawal.status}
                      </span>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm font-medium">Withdrawal Amount</span>
                        <span className="text-3xl font-bold text-green-600">
                          ₦{withdrawal.amount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Requested: {formatDate(withdrawal.requestedAt)}
                        </p>
                        <p className="font-mono">Ref: {withdrawal.reference}</p>
                      </div>
                    </div>


                    
                    {/* Bank Details */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-blue-900" />
                        <p className="text-xs font-semibold text-blue-900">Bank Details</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Name:</span>
                          <span className="font-semibold text-gray-900">{withdrawal.bankDetails?.accountName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-mono font-semibold text-gray-900">{withdrawal.bankDetails?.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-semibold text-gray-900">{withdrawal.bankDetails?.bankName}</span>
                        </div>
                        {withdrawal.bankDetails?.bankCode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Code:</span>
                            <span className="font-mono text-xs text-gray-700">{withdrawal.bankDetails?.bankCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons for Pending */}
                    {withdrawal.status === 'pending' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => { setPendingWithdrawal(withdrawal); setShowAdminPinModal(true); }}                          disabled={processingWithdrawalId === withdrawal.id}
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                        >
                          {processingWithdrawalId === withdrawal.id ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Approve & Transfer via Flutterwave
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(withdrawal.id, withdrawal.sellerId, withdrawal.amount)}
                          disabled={processingWithdrawalId === withdrawal.id}
                          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                        >
                          <X className="w-5 h-5" />
                          Reject Request
                        </button>
                      </div>
                    )}

                    {/* Completed Status */}
                    {withdrawal.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-green-900 font-semibold text-sm mb-2">
                              ✅ Payment Processed Successfully
                            </p>
                            {withdrawal.flutterwaveTransferId && (
                              <div className="text-xs text-gray-700 space-y-1">
                                <p>Transfer ID: <span className="font-mono">{withdrawal.flutterwaveTransferId}</span></p>
                                <p>Processed: {formatDate(withdrawal.processedAt)}</p>
                                <p>By: {withdrawal.processedBy}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejected Status */}
                    {withdrawal.status === 'rejected' && withdrawal.adminNote && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-900 font-semibold text-sm mb-1">Rejection Reason:</p>
                            <p className="text-red-700 text-xs">{withdrawal.adminNote}</p>
                            <p className="text-xs text-gray-500 mt-2">Rejected: {formatDate(withdrawal.processedAt)} by {withdrawal.processedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

     {/* ==================== ALL MODALS ==================== */}

<BookApprovalModal
  isOpen={showModal && modalType === 'advertisement'}
  onClose={closeModal}
  item={selectedItem}
  onApprove={(item) => updateAdvertisementStatus(item.id, 'approved', item)}
  onReject={(item, reason) => updateAdvertisementStatus(item.id, 'rejected', item)}
  checkPdfDuplicate={checkPdfDuplicate}
  formatDate={formatDate}
  getStatusColor={getStatusColor}
/>

<ReplyModal
  isOpen={showModal && modalType === 'reply'}
  onClose={closeModal}
  item={selectedItem}
  replyMessage={replyMessage}
  setReplyMessage={setReplyMessage}
  onSend={sendEmailReply}
  sending={sending}
/>

<TransactionModal
  isOpen={showModal && modalType === 'transaction'}
  onClose={closeModal}
  item={selectedItem}
  formatDate={formatDate}
  getStatusColor={getStatusColor}
/>

<UserModal
  isOpen={showModal && modalType === 'user'}
  onClose={closeModal}
  item={selectedItem}
  formatDate={formatDate}
  getStatusColor={getStatusColor}
  onUpdateStatus={updateUserStatus}
  onDelete={deleteUserAccount}
      />
      
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-blue-950 px-6 py-6 text-center">
              <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-700">
                <Lock className="w-6 h-6 text-blue-200" />
              </div>
              <h3 className="text-white font-bold text-lg">Admin Authorization</h3>
              <p className="text-blue-300 text-xs mt-1">Enter PIN to approve ₦{pendingWithdrawal?.amount?.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">To: {pendingWithdrawal?.sellerName}</p>
            </div>
            <div className="p-6">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter Admin PIN"
                autoFocus
                id="adminPinInput"
                className="w-full text-center text-2xl font-bold tracking-widest border-2 border-gray-200 rounded-2xl px-4 py-4 focus:border-blue-950 focus:outline-none text-blue-950"
              />
              <button
                onClick={() => {
                  const entered = document.getElementById('adminPinInput').value;
                  const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';
                  if (entered !== ADMIN_PIN) {
                    alert('❌ Incorrect PIN');
                    document.getElementById('adminPinInput').value = '';
                    return;
                  }
                  setShowAdminPinModal(false);
                  approveWithdrawal(pendingWithdrawal);
                  setPendingWithdrawal(null);
                }}
                className="w-full mt-4 py-4 bg-green-600 text-white rounded-2xl font-bold text-base hover:bg-green-700 transition-all"
              >
                Confirm Approval
              </button>
              <button
                onClick={() => { setShowAdminPinModal(false); setPendingWithdrawal(null); }}
                className="w-full mt-3 py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}