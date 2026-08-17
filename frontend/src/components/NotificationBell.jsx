import { useEffect, useRef, useState } from "react";
import { listNotifications, markNotificationsRead } from "../api";

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  async function refresh() {
    try {
      const data = await listNotifications();
      setNotifications(data);
    } catch {
      // notifications are non-critical -- fail silently rather than
      // showing an error banner for a background poll
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      try {
        await markNotificationsRead();
      } catch {
        // best-effort; a failed mark-read just gets retried next open
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-paper"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 2a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
          <path d="M8.5 16.5a1.5 1.5 0 003 0h-3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-line bg-panel p-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)]">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">You're all caught up.</p>
          ) : (
            <div className="mt-1 flex max-h-80 flex-col gap-0.5 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 text-sm hover:bg-panel-2">
                  <p className={n.read ? "text-muted" : "text-paper"}>{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
