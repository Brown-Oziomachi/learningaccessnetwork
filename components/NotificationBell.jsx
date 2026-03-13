"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, XCircle, Gift, DollarSign, AlertCircle } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const getNotificationIcon = (type) => {
    switch (type) {
        case 'withdrawal_approved': return <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />;
        case 'withdrawal_rejected': return <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />;
        case 'referral_reward': return <Gift size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />;
        case 'sale': return <DollarSign size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />;
        default: return <AlertCircle size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />;
    }
};

const getNotificationBg = (type, read) => {
    if (read) return 'bg-white';
    switch (type) {
        case 'withdrawal_approved': return 'bg-green-50 border-l-4 border-green-400';
        case 'withdrawal_rejected': return 'bg-red-50 border-l-4 border-red-400';
        case 'referral_reward': return 'bg-purple-50 border-l-4 border-purple-400';
        default: return 'bg-blue-50 border-l-4 border-blue-400';
    }
};

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
};

export default function NotificationBell({ userId }) {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!userId) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [userId]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAsRead = async (id) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                batch.update(doc(db, 'notifications', n.id), { read: true });
            });
            await batch.commit();
        } catch (err) {
            console.error(err);
        }
    };

    const displayed = showAll ? notifications : notifications.slice(0, 5);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                title="Notifications"
            >
                <Bell size={20} className="text-blue-950" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-950 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-blue-200" />
                            <h3 className="text-white font-bold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-blue-300 hover:text-white text-xs transition-colors">
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-blue-300 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                                <p className="text-gray-300 text-xs mt-1">Sales and withdrawals will appear here</p>
                            </div>
                        ) : (
                            displayed.map((n) => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 cursor-pointer transition-all ${getNotificationBg(n.type, n.read)}`}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        {getNotificationIcon(n.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {n.message?.length > 120 ? n.message.slice(0, 120) + '...' : n.message}
                                            </p>
                                            {!n.read && (
                                                <span className="inline-block mt-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 5 && (
                        <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
                            <button
                                onClick={() => setShowAll(prev => !prev)}
                                className="w-full text-center text-xs text-blue-950 font-semibold hover:text-blue-700 transition-colors"
                            >
                                {showAll ? 'Show less' : `View all ${notifications.length} notifications`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}