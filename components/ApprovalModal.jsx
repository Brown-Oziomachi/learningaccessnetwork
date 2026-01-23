import React, { useState } from 'react';
import { 
  Check, X, AlertCircle, FileText, User, Mail, Calendar, DollarSign, 
  BookOpen, Book, ShieldCheck, Building, Phone, Send, Lock, UserX, 
  Trash2, AlertTriangle 
} from 'lucide-react';

// ==================== BOOK APPROVAL MODAL ====================
export const BookApprovalModal = ({ 
  isOpen, 
  onClose, 
  item, 
  onApprove, 
  onReject,
  checkPdfDuplicate,
  formatDate,
  getStatusColor
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  if (!isOpen || !item) return null;

  const handleApprove = async () => {
    if (checkPdfDuplicate) {
      setCheckingDuplicate(true);
      const isDuplicate = await checkPdfDuplicate(item.pdfUrl || item.embedUrl);
      setCheckingDuplicate(false);

      if (isDuplicate) {
        alert('⚠️ This PDF already exists in the database. Cannot approve duplicate.');
        return;
      }
    }
    setActionType('approve');
    setShowConfirm(true);
  };

  const handleReject = () => {
    setActionType('reject');
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
    setRejectionReason('');
    setShowReasonInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={resetModal} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Book Review</h2>
                  <p className="text-sm text-blue-100">Review and take action</p>
                </div>
              </div>
              <button onClick={resetModal} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Book Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.bookTitle}</h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      by {item.author}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-2xl font-bold text-green-600">₦{item.price?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Category</p>
                    <p className="font-semibold text-gray-900 capitalize">{item.category}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Pages</p>
                    <p className="font-semibold text-gray-900">{item.pages || 'N/A'}</p>
                  </div>
                  {item.institutionalCategory && (
                    <div className="bg-white rounded-lg p-3 col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Institutional Category</p>
                      <p className="font-semibold text-gray-900 capitalize">{item.institutionalCategory}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Submitted</p>
                    <p className="text-xs text-gray-900">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3 font-semibold">Seller Information</p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{item.sellerName}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {item.sellerEmail}
                  </p>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Description</p>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              )}

              {/* PDF Preview */}
              {item.driveFileId && (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Book Preview</p>
                  <img
                    src={`https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w400`}
                    alt="Book Preview"
                    className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                  />
                </div>
              )}

              {/* PDF Embed */}
              {(item.embedUrl || item.pdfUrl || item.pdfLink) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">PDF Document</p>
                    <a href={item.embedUrl || item.pdfUrl || item.pdfLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                      <FileText className="w-4 h-4" />Open in New Tab
                    </a>
                  </div>
                  <iframe src={item.embedUrl || item.pdfUrl || item.pdfLink} className="w-full h-96 border-2 border-gray-300 rounded-lg" title="PDF Preview" />
                </div>
              )}

              {/* Checking Duplicate */}
              {checkingDuplicate && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                    <p className="text-yellow-800 font-semibold">Checking for duplicate PDFs...</p>
                  </div>
                </div>
              )}

              {/* Approval Confirmation */}
              {showConfirm && actionType === 'approve' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 mb-2">Confirm Approval</h3>
                      <p className="text-sm text-green-700 mb-4">This book will be published and visible to all users. The seller will be notified.</p>
                      <div className="flex gap-3">
                        <button onClick={confirmApprove} disabled={isProcessing} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold">
                          {isProcessing ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />Processing...</> : <><ShieldCheck className="w-5 h-5" />Yes, Approve</>}
                        </button>
                        <button onClick={() => setShowConfirm(false)} disabled={isProcessing} className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Input */}
              {showReasonInput && actionType === 'reject' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 rounded-full p-3">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-2">Confirm Rejection</h3>
                      <p className="text-sm text-red-700 mb-4">This book will be rejected. Reason (optional):</p>
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter rejection reason..." className="w-full h-24 px-4 py-3 border-2 border-red-200 rounded-lg resize-none text-gray-900 focus:outline-none focus:border-red-400" />
                      <div className="flex gap-3 mt-4">
                        <button onClick={confirmReject} disabled={isProcessing} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold">
                          {isProcessing ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />Processing...</> : <><X className="w-5 h-5" />Confirm Rejection</>}
                        </button>
                        <button onClick={() => { setShowReasonInput(false); setRejectionReason(''); }} disabled={isProcessing} className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!showConfirm && !showReasonInput && !checkingDuplicate && (
                <div className="flex gap-4">
                  <button onClick={handleApprove} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl">
                    <Check className="w-6 h-6" />Approve
                  </button>
                  <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl">
                    <X className="w-6 h-6" />Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== REPLY MODAL ====================
export const ReplyModal = ({ isOpen, onClose, item, replyMessage, setReplyMessage, onSend, sending }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send Reply</h2>
                  <p className="text-sm text-purple-100">Respond to user inquiry</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">To: {item?.email || item?.reporterEmail}</p>
              <p className="text-sm text-gray-600">Subject: Re: {item?.subject || item?.reason || 'Your inquiry'}</p>
            </div>
            <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply here..." className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none text-black focus:outline-none focus:border-purple-400" />
            <div className="flex gap-3 mt-4">
              <button onClick={onSend} disabled={sending} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold">
                {sending ? 'Sending...' : <><Send className="w-4 h-4" />Send Reply</>}
              </button>
              <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TRANSACTION MODAL ====================
export const TransactionModal = ({ isOpen, onClose, item, formatDate, getStatusColor }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Transaction Details</h2>
                  <p className="text-sm text-green-100">View transaction information</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-950 mb-3">Transaction Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900">{item.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="font-bold text-2xl text-green-600">₦{item.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status || 'completed')}`}>{item.status || 'completed'}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm text-gray-900">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-3">Book Details</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Book Title</p>
                  <p className="font-semibold text-gray-900">{item.bookTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Book ID</p>
                  <p className="font-mono text-sm text-gray-700">{item.bookId}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />Seller Information (Money Recipient)
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Seller Name</p>
                  <p className="font-semibold text-gray-900">{item.sellerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Seller Email</p>
                  <p className="font-semibold text-gray-900">{item.sellerEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Seller ID</p>
                  <p className="font-mono text-sm text-gray-700">{item.sellerId || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-900 mb-3">Buyer Information</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Buyer Name</p>
                  <p className="font-semibold text-gray-900">{item.buyerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buyer Email</p>
                  <p className="font-semibold text-gray-900">{item.buyerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Buyer ID</p>
                  <p className="font-mono text-sm text-gray-700">{item.buyerId || 'N/A'}</p>
                </div>
              </div>
            </div>

            {item.paymentMethod && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-3">Payment Details</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm text-gray-900">{item.paymentMethod}</p>
                  </div>
                  {item.transactionReference && (
                    <div>
                      <p className="text-xs text-gray-500">Reference</p>
                      <p className="font-mono text-sm text-gray-700">{item.transactionReference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={onClose} className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== USER MODAL ====================
export const UserModal = ({ isOpen, onClose, item, formatDate, getStatusColor, onUpdateStatus, onDelete }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
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
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
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
                  <p className="font-semibold text-gray-900">{item.displayName || 'N/A'}</p>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{item.role || 'user'}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.accountStatus || 'active')}`}>{item.accountStatus || 'active'}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Joined</p>
                  <p className="text-sm text-gray-900">{formatDate(item.createdAt)}</p>
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
                    <p className="text-sm text-gray-900">{formatDate(item.lastLogin)}</p>
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
                <AlertTriangle className="w-5 h-5" />Account Management
              </h4>
              <p className="text-sm text-gray-700 mb-4">Manage this user's account status.</p>
              <div className="grid grid-cols-2 gap-3">
                {item.accountStatus !== 'active' && (
                  <button onClick={() => onUpdateStatus(item.id, 'active')} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />Activate
                  </button>
                )}
                {item.accountStatus !== 'pending' && (
                  <button onClick={() => onUpdateStatus(item.id, 'pending')} className="bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />Set Pending
                  </button>
                )}
                {item.accountStatus !== 'suspended' && (
                  <button onClick={() => onUpdateStatus(item.id, 'suspended')} className="bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2">
                    <UserX className="w-4 h-4" />Suspend
                  </button>
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />Danger Zone
              </h4>
              <p className="text-sm text-gray-700 mb-4">Permanently delete this user account. This action cannot be undone.</p>
              <button onClick={() => onDelete(item.id)} className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />Delete Account Permanently
              </button>
            </div>

            <button onClick={onClose} className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};