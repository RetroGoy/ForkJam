"use client";

export function NotificationsModal() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          NOTIFICATIONS
        </span>
      </div>

      <div className="p-6 text-gray-300 text-sm">
        <p className="text-center opacity-70">
          No notifications yet.
        </p>
      </div>
    </div>
  );
}