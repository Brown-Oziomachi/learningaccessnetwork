// components/OfficialBadge.jsx
import { ShieldCheck, BadgeCheck } from "lucide-react";

export function OfficialBadge({ size = "small" }) {
    if (size === "large") {
        return (
            <div className="inline-flex items-center gap-1.5 bg-[#0F172A] text-white px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                OFFICIAL
                <BadgeCheck className="w-4 h-4 text-blue-400" />
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-300 text-[#0F172A] px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider">
            <ShieldCheck className="w-3 h-3 text-yellow-600" />
            OFFICIAL
            <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
        </span>
    );
}

export function OfficialAvatar({ src = "/lanlog.png" }) {
    return (
        <div className="relative shrink-0">
            <img
                src={src}
                alt="LAN Library official logo"
                className="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <BadgeCheck className="w-4 h-4 text-blue-600" />
            </div>
        </div>
    );
}