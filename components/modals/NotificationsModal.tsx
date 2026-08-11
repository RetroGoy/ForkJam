"use client";

export function NotificationsModal() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          Notifications
        </span>
      </div>

      <div className="p-6 text-sm text-muted-foreground">
        <p className="text-center">
          No notifications yet.
        </p>
      </div>
    </div>
  );
}