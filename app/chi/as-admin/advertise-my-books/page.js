"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { 
  FileText, Trash2, Check, X, Search, Calendar, User, Shield, 
  Eye, Mail, MessageSquare, AlertCircle, TrendingUp,
  DollarSign, Users, BookOpen, ChevronRight, Send, RefreshCw, BarChart3,
  Settings, Flag, XCircle, AlertTriangle, UserX, Lock
} from 'lucide-react';

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
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const ADMIN_EMAILS = ['browncemmanuel@gmail.com', 'chigozirimv35@gmail.com'];

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
      if (ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
        await fetchAllData();
        setCheckingAdmin(false);
        return;
      }
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.isAdmin === true) {
          setIsAdmin(true);
          await fetchAllData();
        }
      }
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
      await Promise.all([fetchAdvertisements(), fetchSupportTickets(), fetchBookReports(), fetchTransactions(), fetchUsers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const checkPdfDuplicate = async (pdfUrl) => {
    if (!pdfUrl) return false;
    setCheckingDuplicate(true);
    try {
      const q = query(collection(db, 'advertMyBook'), where('pdfUrl', '==', pdfUrl), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
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
      const isDuplicate = await checkPdfDuplicate(ad.pdfUrl);
      if (isDuplicate) {
        alert('This PDF already exists in the database. Cannot approve duplicate.');
        return;
      }
    }
    await updateDoc(doc(db, 'advertMyBook', id), { status, reviewedAt: serverTimestamp() });
    setAdvertisements(advertisements.map(a => a.id === id ? { ...a, status } : a));
    alert(`Book ${status} successfully`);
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

 const sendEmailReply = async () => {
  if (!replyMessage.trim() || !selectedItem) {
    alert('Please write a message');
    return;
  }
  
  console.log('=== STARTING REPLY PROCESS ===');
  console.log('📧 Current user:', user);
  console.log('📧 User email:', user?.email);
  console.log('📧 Selected item:', selectedItem);
  console.log('📧 Active section:', activeSection);
  
  setSending(true);
  
  try {
    // Step 1: Prepare reply data
    const replyData = {
      to: selectedItem.email || selectedItem.reporterEmail,
      subject: `Re: ${selectedItem.subject || selectedItem.reason || 'Your inquiry'}`,
      message: replyMessage,
      from: user.email,
      sentAt: serverTimestamp(),
      originalTicketId: selectedItem.id,
      type: activeSection
    };
    
    console.log('📝 Reply data prepared:', replyData);
    
    // Step 2: Try to save to adminReplies
    console.log('💾 Attempting to save to adminReplies...');
    const replyRef = await addDoc(collection(db, 'adminReplies'), replyData);
    console.log('✅ Reply saved successfully! Doc ID:', replyRef.id);
    
    // Step 3: Update the original ticket/report
    const collectionName = activeSection === 'support' ? 'supportTickets' : 'bookReports';
    console.log(`📝 Updating ${collectionName} with ID: ${selectedItem.id}`);
    
    await updateDoc(doc(db, collectionName, selectedItem.id), {
      adminResponse: replyMessage,
      status: 'resolved',
      resolvedAt: serverTimestamp()
    });
    
    console.log('✅ Status updated successfully!');
    
    alert('Reply sent successfully!');
    setShowModal(false);
    setReplyMessage('');
    setSelectedItem(null);
    
    // Refresh the appropriate list
    if (activeSection === 'support') {
      await fetchSupportTickets();
    } else {
      await fetchBookReports();
    }
    
    console.log('✅ Data refreshed!');
    
  } catch (error) {
    console.error('❌ ===== ERROR DETAILS =====');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Show detailed error message
    alert(`Failed to send reply: ${error.message}\n\nCheck console for details.`);
  } finally {
    setSending(false);
    console.log('=== REPLY PROCESS ENDED ===');
  }
};

  const openModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
    setReplyMessage('');
    setPdfUrl('');
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
    totalUsers: users.length,
    totalBooks: advertisements.length,
    pendingAds: advertisements.filter(a => a.status === 'pending').length,
    openTickets: supportTickets.filter(t => t.status === 'open').length,
    pendingReports: bookReports.filter(r => r.status === 'pending').length
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
          <button onClick={fetchAllData} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
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
            { id: 'support', icon: MessageSquare, label: 'Support', badge: stats.openTickets },
            { id: 'reports', icon: Flag, label: 'Reports', badge: stats.pendingReports },
            { id: 'transactions', icon: DollarSign, label: 'Sales' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveSection(id)} className={`p-4 rounded-lg transition-all ${activeSection === id ? 'bg-white text-blue-950 shadow-lg' : 'bg-blue-900 text-white hover:bg-blue-800'}`}>
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
                { label: 'Transactions', value: stats.totalTransactions, icon: TrendingUp, color: 'orange' }
              ].map(({ label, value, icon: Icon, color }) => (
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
                { title: 'Pending Reports', count: stats.pendingReports, section: 'reports', color: 'orange', bg: 'orange-50', border: 'orange-200' }
              ].map(({ title, count, section, color, bg, border }) => (
                <div key={section} className={`bg-${bg} border border-${border} rounded-lg p-6`}>
                  <h3 className={`font-bold text-${color}-900 mb-2`}>{title}</h3>
                  <p className={`text-3xl font-bold text-${color}-600 mb-4`}>{count}</p>
                  <button onClick={() => setActiveSection(section)} className={`text-${color}-800 hover:underline text-sm flex items-center gap-1`}>
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
            <div className="bg-white rounded-lg shadow-sm p-4">
              <input type="text" placeholder="Search books..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {advertisements.filter(ad => ad.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase())).map((ad) => (
                <div key={ad.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{ad.bookTitle}</h3>
                      <p className="text-sm text-gray-600">by {ad.author}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ad.status)}`}>{ad.status}</span>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <p><span className="text-gray-600">Email:</span> {ad.email}</p>
                    <p><span className="text-gray-600">Price:</span> ₦{ad.price?.toLocaleString()}</p>
                    <p><span className="text-gray-600">Category:</span> {ad.category}</p>
                    <p><span className="text-gray-600">Date:</span> {formatDate(ad.createdAt)}</p>
                    {ad.pdfUrl && <p className="text-xs text-blue-600 truncate">PDF Available</p>}
                  </div>
                  <button onClick={() => openModal('advertisement', ad)} className="w-full bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 flex items-center justify-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />View Details & PDF
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
            <h2 className="text-2xl font-bold text-white">All Users</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-950 text-white border-b">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6">
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

        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600">Admin settings and configuration options coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {modalType === 'reply' && 'Send Reply'}
                  {modalType === 'advertisement' && 'Book Advertisement Details'}
                  {modalType === 'transaction' && 'Transaction Details'}
                  {modalType === 'user' && 'User Account Details'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {modalType === 'reply' && (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">To: {selectedItem?.email || selectedItem?.reporterEmail}</p>
                    <p className="text-sm text-gray-600">Subject: Re: {selectedItem?.subject || selectedItem?.reason || 'Your inquiry'}</p>
                  </div>
                  <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply here..." className="w-full h-48 px-4 py-2 border border-gray-300 rounded-lg resize-none text-black" />
                  <div className="flex gap-3 mt-4">
                    <button onClick={sendEmailReply} disabled={sending} className="flex-1 bg-blue-950 text-white py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2">
                      {sending ? 'Sending...' : <><Send className="w-4 h-4" />Send Reply</>}
                    </button>
                    <button onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'advertisement' && selectedItem && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Book Title</p>
                      <p className="font-semibold text-gray-900">{selectedItem.bookTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Author</p>
                      <p className="font-semibold text-gray-900">{selectedItem.author}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{selectedItem.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="font-semibold text-green-600">₦{selectedItem.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="font-semibold text-gray-900">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">{selectedItem.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Submitted</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                  </div>

                  {selectedItem.pdfUrl && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <p className="font-semibold text-blue-950">PDF Preview</p>
                        <a href={selectedItem.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          Open in New Tab
                        </a>
                      </div>
                      <iframe src={selectedItem.pdfUrl} className="w-full h-96 border border-gray-300 rounded-lg" title="PDF Preview" />
                    </div>
                  )}

                  {checkingDuplicate && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="animate-spin h-5 w-5 border-b-2 border-yellow-600 rounded-full"></div>
                      <p className="text-yellow-800">Checking for duplicate PDFs...</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {selectedItem.status !== 'approved' && (
                      <button onClick={() => updateAdvertisementStatus(selectedItem.id, 'approved', selectedItem)} disabled={checkingDuplicate} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Approve Book
                      </button>
                    )}
                    {selectedItem.status !== 'rejected' && (
                      <button onClick={() => updateAdvertisementStatus(selectedItem.id, 'rejected', selectedItem)} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
                        <X className="w-5 h-5" />
                        Reject Book
                      </button>
                    )}
                  </div>
                </div>
              )}

              {modalType === 'transaction' && selectedItem && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-950 mb-3">Transaction Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                        <p className="font-mono text-sm text-gray-900">{selectedItem.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="font-bold text-2xl text-green-600">₦{selectedItem.amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedItem.status || 'completed')}`}>
                          {selectedItem.status || 'completed'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-3">Book Details</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Book Title</p>
                        <p className="font-semibold text-gray-900">{selectedItem.bookTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Book ID</p>
                        <p className="font-mono text-sm text-gray-700">{selectedItem.bookId}</p>
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
                        <p className="font-semibold text-gray-900">{selectedItem.sellerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Seller Email</p>
                        <p className="font-semibold text-gray-900">{selectedItem.sellerEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Seller ID</p>
                        <p className="font-mono text-sm text-gray-700">{selectedItem.sellerId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-3">Buyer Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Buyer Name</p>
                        <p className="font-semibold text-gray-900">{selectedItem.buyerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Buyer Email</p>
                        <p className="font-semibold text-gray-900">{selectedItem.buyerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Buyer ID</p>
                        <p className="font-mono text-sm text-gray-700">{selectedItem.buyerId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedItem.paymentMethod && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-3">Payment Details</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Payment Method</p>
                          <p className="text-sm text-gray-900">{selectedItem.paymentMethod}</p>
                        </div>
                        {selectedItem.transactionReference && (
                          <div>
                            <p className="text-xs text-gray-500">Reference</p>
                            <p className="font-mono text-sm text-gray-700">{selectedItem.transactionReference}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button onClick={closeModal} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                    Close
                  </button>
                </div>
              )}

              {modalType === 'user' && selectedItem && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-950 mb-3">User Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Display Name</p>
                        <p className="font-semibold text-gray-900">{selectedItem.displayName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{selectedItem.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">User ID</p>
                        <p className="font-mono text-xs text-gray-700">{selectedItem.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Role</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedItem.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedItem.role || 'user'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Account Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedItem.accountStatus || 'active')}`}>
                          {selectedItem.accountStatus || 'active'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Joined</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                      </div>
                      {selectedItem.phoneNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                          <p className="text-sm text-gray-900">{selectedItem.phoneNumber}</p>
                        </div>
                      )}
                      {selectedItem.lastLogin && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Login</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedItem.lastLogin)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItem.bio && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-2">Bio</p>
                      <p className="text-sm text-gray-900">{selectedItem.bio}</p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Account Management
                    </h4>
                    <p className="text-sm text-gray-700 mb-4">
                      Manage this user's account status. Pending status allows users to appeal through the report page.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedItem.accountStatus !== 'active' && (
                        <button onClick={() => updateUserStatus(selectedItem.id, 'active')} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Activate
                        </button>
                      )}
                      {selectedItem.accountStatus !== 'pending' && (
                        <button onClick={() => updateUserStatus(selectedItem.id, 'pending')} className="bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          Set Pending
                        </button>
                      )}
                      {selectedItem.accountStatus !== 'suspended' && (
                        <button onClick={() => updateUserStatus(selectedItem.id, 'suspended')} className="bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2">
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
                      Permanently delete this user account. This action cannot be undone.
                    </p>
                    <button onClick={() => deleteUserAccount(selectedItem.id)} className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Account Permanently
                    </button>
                  </div>

                  <button onClick={closeModal} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}