"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';
import { FileText, Download, Trash2, Check, X, Search, Filter, Calendar, User, Shield, Link2, Eye, Copy, CheckCircle } from 'lucide-react';

export default function AdminAdvertMyBook() {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [extractedUrls, setExtractedUrls] = useState(null);
  const [copied, setCopied] = useState('');

  const ADMIN_EMAILS = [
    'browncemmanuel@gmail.com',
    'chigozirimv35@gmail.com',
  ];

  // Google Drive URL utility functions
  const extractDriveFileId = (url) => {
    if (!url) return null;
    
    const pattern1 = url.match(/\/file\/d\/([^\/\?]+)/);
    if (pattern1) return pattern1[1];
    
    const pattern2 = url.match(/[?&]id=([^&]+)/);
    if (pattern2) return pattern2[1];
    
    const pattern3 = url.match(/\/open\?id=([^&]+)/);
    if (pattern3) return pattern3[1];
    
    if (url.length > 20 && !url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    return null;
  };

  const getDriveUrls = (driveLink) => {
    const fileId = extractDriveFileId(driveLink);
    
    if (!fileId) {
      return null;
    }
    
    return {
      fileId,
      preview: `https://drive.google.com/file/d/${fileId}/view`,
      download: `https://drive.google.com/uc?export=download&id=${fileId}`,
      embed: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
    };
  };

  const handleExtractDriveUrl = () => {
    const urls = getDriveUrls(driveUrl);
    if (urls) {
      setExtractedUrls(urls);
    } else {
      alert('Invalid Google Drive URL. Please paste a valid link.');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const addDriveUrlToAd = async (adId) => {
    if (!extractedUrls) {
      alert('Please extract URLs first');
      return;
    }

    try {
      const adRef = doc(db, 'advertMyBook', adId);
      await updateDoc(adRef, {
        driveFileId: extractedUrls.fileId,
        pdfUrl: extractedUrls.download,
        previewUrl: extractedUrls.preview,
        embedUrl: extractedUrls.embed
      });

      setAdvertisements(advertisements.map(ad => 
        ad.id === adId ? { 
          ...ad, 
          driveFileId: extractedUrls.fileId,
          pdfUrl: extractedUrls.download,
          previewUrl: extractedUrls.preview
        } : ad
      ));

      alert('Google Drive URLs added successfully!');
      setShowDriveModal(false);
      setDriveUrl('');
      setExtractedUrls(null);
      setSelectedAd(null);
    } catch (error) {
      console.error('Error adding Drive URLs:', error);
      alert('Error adding Drive URLs');
    }
  };

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
        fetchAdvertisements();
        setCheckingAdmin(false);
        return;
      }

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
    if (!ad.pdfData && !ad.pdfUrl) {
      alert('No PDF available');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = ad.pdfUrl || ad.pdfData;
      link.download = ad.pdfFileName || `${ad.bookTitle}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  const previewPDF = (ad) => {
    if (!ad.previewUrl && !ad.driveFileId) {
      alert('No preview available');
      return;
    }

    const previewUrl = ad.previewUrl || `https://drive.google.com/file/d/${ad.driveFileId}/view`;
    window.open(previewUrl, '_blank');
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

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {!user ? 'Access Denied' : 'Unauthorized Access'}
          </h2>
          <p className="text-gray-600 mb-4">
            {!user ? 'Please sign in to access the admin panel' : "You don't have permission to access this page."}
          </p>
          <a 
            href={!user ? '/auth/signin?redirect=/admin/advert-books' : '/home'}
            className="inline-block bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors"
          >
            {!user ? 'Sign In' : 'Go to Home'}
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Advertisements</h1>
              <p className="text-gray-600">Manage book advertisement requests & add Google Drive PDFs</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">Admin</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                  {/* Drive Status */}
                  {ad.driveFileId && (
                    <div className="mb-4 flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded">
                      <CheckCircle className="w-4 h-4" />
                      <span>Google Drive PDF linked</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="truncate">{ad.name} ({ad.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(ad.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium text-blue-950">{ad.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 font-medium">₦{ad.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

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
                    <button
                      onClick={() => {
                        setSelectedAd(ad);
                        setShowDriveModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Link2 className="w-4 h-4" />
                      Drive
                    </button>
                    {ad.previewUrl && (
                      <button
                        onClick={() => previewPDF(ad)}
                        className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    )}
                    <button
                      onClick={() => deleteAdvertisement(ad.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Google Drive URL Modal */}
      {showDriveModal && selectedAd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Google Drive PDF</h2>
                  <p className="text-sm text-gray-600 mt-1">For: {selectedAd.bookTitle}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowDriveModal(false);
                    setDriveUrl('');
                    setExtractedUrls(null);
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paste Google Drive Share Link
                  </label>
                  <input
                    type="text"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the file is set to "Anyone with the link" can view
                  </p>
                </div>

                <button
                  onClick={handleExtractDriveUrl}
                  className="w-full bg-blue-950 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-semibold"
                >
                  Extract URLs
                </button>

                {extractedUrls && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      URLs Extracted Successfully!
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700">File ID</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-xs text-black bg-white px-3 py-2 rounded border border-gray-200 overflow-x-auto">
                            {extractedUrls.fileId}
                          </code>
                          <button
                            onClick={() => copyToClipboard(extractedUrls.fileId, 'fileId')}
                            className="p-2 hover:bg-green-100 rounded"
                          >
                            {copied === 'fileId' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700">Preview URL</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-xs text-black bg-white px-3 py-2 rounded border border-gray-200 overflow-x-auto">
                            {extractedUrls.preview}
                          </code>
                          <button
                            onClick={() => copyToClipboard(extractedUrls.preview, 'preview')}
                            className="p-2 hover:bg-green-100 rounded"
                          >
                            {copied === 'preview' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700">Download URL</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-xs text-black bg-white px-3 py-2 rounded border border-gray-200 overflow-x-auto">
                            {extractedUrls.download}
                          </code>
                          <button
                            onClick={() => copyToClipboard(extractedUrls.download, 'download')}
                            className="p-2 hover:bg-green-100 rounded"
                          >
                            {copied === 'download' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200">
                      <button
                        onClick={() => addDriveUrlToAd(selectedAd.id)}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Save to Advertisement
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">How to get Google Drive link:</h4>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Upload PDF to Google Drive</li>
                    <li>Right-click → Share</li>
                    <li>Change to "Anyone with the link"</li>
                    <li>Set permission to "Viewer"</li>
                    <li>Copy link and paste here</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}