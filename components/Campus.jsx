import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { TrendingUp, Users, Zap } from "lucide-react";
import { db } from "@/lib/firebaseConfig";

export default function CampusPulse() {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const booksRef = collection(db, "advertMyBook");
        
        // Query: Approved books, ordered by salesCount, top 5
        const q = query(
            booksRef,
            where("status", "==", "approved"),
            orderBy("salesCount", "desc"),
            limit(5)
        );

        // Using onSnapshot for "Real-time" pulse
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const books = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTrending(books);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching Campus Pulse:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <div className="p-6 text-slate-400 text-xs">Loading Pulse...</div>;

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-500" /> Campus Pulse
                </h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trending Now</span>
            </div>

            <div className="space-y-2">
                {trending.map((b, i) => (
                    <div key={b.id} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 transition-all cursor-pointer relative overflow-hidden bg-white border border-slate-100 shadow-sm">
                        
                        {/* Rank */}
                        <span className="text-xl font-black text-slate-100 group-hover:text-orange-200 transition-colors w-7 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                        </span>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{b.bookTitle}</p>
                                {/* Social Proof: If sales > 0, show pulse */}
                                {b.salesCount > 0 && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Users size={10} />
                                    <span className="font-bold text-slate-600">{b.salesCount || 0}</span> peers reading
                                </p>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <p className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                    {b.category}
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-indigo-600 block">
                                ₦{b.price?.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{b.format || 'PDF'}</span>
                        </div>

                        {/* Hover Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-orange-400 transition-all duration-500 w-0 group-hover:w-full" />
                    </div>
                ))}
            </div>
        </section>
    );
};

