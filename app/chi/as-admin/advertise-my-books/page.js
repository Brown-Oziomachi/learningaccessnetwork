"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { FileText, Download, Trash2, Check, X, Search, Filter, Calendar, User, Shield } from 'lucide-react';

export default function AdminAdvertMyBook() {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // List of admin email addresses (you can also store this in Firestore)
  const ADMIN_EMAILS = [
    'browncemmanuel@gmail.com',
    'chigozirimv35@gmail.com',
    // Add your admin emails here
  ];

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
      // Method 1: Check by email
      if (ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
        fetchAdvertisements();
        setCheckingAdmin(false);
        return;
      }

      // Method 2: Check Firestore for admin role
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.isAdmin === true) {
          setIsAdmin(true);
          fetchAdvertisements();
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'advertMyBook'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ads = [];
      querySnapshot.forEach((doc) => {
        ads.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setAdvertisements(ads);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      alert('Error loading advertisements');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (adId, newStatus) => {
    try {
      const adRef = doc(db, 'advertMyBook', adId);
      await updateDoc(adRef, { status: newStatus });
      
      setAdvertisements(advertisements.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ));
      
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const deleteAdvertisement = async (adId) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;
    
    try {
      await deleteDoc(doc(db, 'advertMyBook', adId));
      setAdvertisements(advertisements.filter(ad => ad.id !== adId));
      setSelectedAd(null);
      alert('Advertisement deleted successfully');
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      alert('Error deleting advertisement');
    }
  };

  const downloadPDF = (ad) => {
    if (!ad.pdfData) {
      alert('No PDF available');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = ad.pdfData;
      link.download = ad.pdfFileName || `${ad.bookTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  const filteredAds = advertisements.filter(ad => {
    const matchesSearch = 
      ad.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || ad.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please sign in to access the admin panel</p>
          <a 
            href="/auth/signin?redirect=/admin/advert-books" 
            className="inline-block bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-4">Purchase books and read</p>
          <a 
            href="/home" 
            className="inline-block bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-950 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading advertisements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Advertisements</h1>
              <p className="text-gray-600">Manage book advertisement requests</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">Admin Access</p>
                <p className="text-xs text-green-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, author, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900">{advertisements.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {advertisements.filter(ad => ad.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {advertisements.filter(ad => ad.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {advertisements.filter(ad => ad.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Advertisements List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAds.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No advertisements found</p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <div key={ad.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{ad.bookTitle}</h3>
                      <p className="text-gray-600 text-sm">by {ad.author}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ad.status)}`}>
                      {ad.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{ad.name} ({ad.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(ad.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium">{ad.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 font-medium">₦{ad.price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pages:</span>
                        <span className="ml-2 font-medium">{ad.pages}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-2 font-medium">{ad.format}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                  </div>

                  {/* PDF Info */}
                  {ad.pdfFileName && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">{ad.pdfFileName}</span>
                        {ad.pdfSize && (
                          <span className="text-xs text-gray-500">
                            ({(ad.pdfSize / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {ad.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(ad.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {ad.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(ad.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                    {ad.pdfData && (
                      <button
                        onClick={() => downloadPDF(ad)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => deleteAdvertisement(ad.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAd.bookTitle}</h2>
                <button onClick={() => setSelectedAd(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Author</label>
                  <p className="text-gray-900">{selectedAd.author}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Submitted By</label>
                    <p className="text-gray-900">{selectedAd.name}</p>
                    <p className="text-gray-600 text-sm">{selectedAd.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Date</label>
                    <p className="text-gray-900">{formatDate(selectedAd.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <p className="text-gray-900">{selectedAd.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Price</label>
                    <p className="text-gray-900">₦{selectedAd.price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Pages</label>
                    <p className="text-gray-900">{selectedAd.pages}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Format</label>
                    <p className="text-gray-900">{selectedAd.format}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedAd.description}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Promotion Message</label>
                  <p className="text-gray-900">{selectedAd.message}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAd.status)}`}>
                    {selectedAd.status}
                  </span>
                </div>

                {selectedAd.pdfData && (
                  <button
                    onClick={() => downloadPDF(selectedAd)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}