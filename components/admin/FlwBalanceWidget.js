// components/admin/FlwBalanceWidget.js
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, CheckCircle, Wallet, RefreshCw, ExternalLink } from 'lucide-react';

export default function FlwBalanceWidget() {
    const [balanceData, setBalanceData] = useState(null);
    const [alertData, setAlertData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Live-listen to Firestore balance doc
    useEffect(() => {
        const unsub1 = onSnapshot(doc(db, 'system', 'flutterwaveBalance'), (snap) => {
            if (snap.exists()) setBalanceData(snap.data());
        });
        const unsub2 = onSnapshot(doc(db, 'system', 'flutterwaveBalanceAlert'), (snap) => {
            if (snap.exists()) setAlertData(snap.data());
        });
        return () => { unsub1(); unsub2(); };
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/flutterwave-balance-alert', { method: 'POST' });
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const balance = balanceData?.balance ?? null;
    const isLow = balanceData?.isLow ?? false;
    const threshold = balanceData?.threshold ?? 50000;
    const alertUnresolved = alertData && !alertData.resolved;

    const checkedAt = balanceData?.checkedAt?.toDate?.();
    const timeAgo = checkedAt
        ? Math.floor((Date.now() - checkedAt.getTime()) / 60000) + 'm ago'
        : null;

    return (
        <div className={`rounded-2xl border-2 p-5 transition-all ${isLow
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-200'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                        {isLow
                            ? <AlertTriangle size={18} className="text-red-600" />
                            : <Wallet size={18} className="text-green-600" />
                        }
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Flutterwave Wallet</p>
                        {timeAgo && <p className="text-xs text-gray-400">Updated {timeAgo}</p>}
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 rounded-xl hover:bg-white/60 transition-colors"
                    title="Refresh balance"
                >
                    <RefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Balance */}
            <div className="mb-3">
                {balance !== null ? (
                    <p className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-green-700'}`}>
                        ₦{balance.toLocaleString()}
                    </p>
                ) : (
                    <p className="text-2xl font-bold text-gray-400">Loading...</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Alert threshold: ₦{threshold.toLocaleString()}
                </p>
            </div>

            {/* Progress bar */}
            {balance !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                        className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min((balance / (threshold * 2)) * 100, 100)}%` }}
                    />
                </div>
            )}

            {/* Alert banner */}
            {isLow && alertUnresolved && (
                <div className="bg-red-100 border border-red-200 rounded-xl p-3 mb-3">
                    <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Low Balance Alert Active
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        Sellers may be unable to purchase airtime or data. Please fund your Flutterwave wallet immediately.
                    </p>
                </div>
            )}

            {/* Healthy state */}
            {!isLow && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                    <CheckCircle size={13} /> Balance is healthy
                </div>
            )}

            {/* Fund button */}
            {isLow && (
                <a
                    href="https://dashboard.flutterwave.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                    Fund Flutterwave Wallet <ExternalLink size={14} />
                </a>
            )}
        </div>
    );
}