// components/OfficialNotificationCard.jsx
import { OfficialBadge, OfficialAvatar } from "./OfficialBadge";

export function OfficialNotificationCard({ title, message, time, link }) {
  const body = (
    <div className="flex gap-3 p-4 bg-gradient-to-r from-yellow-50 to-white border-l-4 border-yellow-400 rounded-lg shadow-sm">
      <OfficialAvatar />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm">LAN Library</p>
          <OfficialBadge size="small" />
        </div>
        {title && (
          <p className="text-sm font-semibold text-gray-800 mt-1">{title}</p>
        )}
        {message && <p className="text-sm text-gray-700 mt-1">{message}</p>}
        <p className="text-[11px] text-gray-500 mt-1">
          {time} • System • Announcements Only
        </p>
      </div>
    </div>
  );

  return link ? (
    <a href={link} className="block">
      {body}
    </a>
  ) : (
    body
  );
}

export function NormalNotificationCard({ title, message, time, link }) {
  const body = (
    <div className="flex gap-3 p-4 bg-white border border-gray-100 rounded-lg">
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        <p className="text-[11px] text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );

  return link ? (
    <a href={link} className="block">
      {body}
    </a>
  ) : (
    body
  );
}
