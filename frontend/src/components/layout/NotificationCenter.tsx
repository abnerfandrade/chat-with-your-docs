import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";

const toneClassName = {
  info: "border-sky-400/30 bg-sky-500/10",
  success: "border-emerald-400/30 bg-emerald-500/10",
  error: "border-rose-400/30 bg-rose-500/10",
} as const;

export function NotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    notifications.forEach((notification) => {
      if (timersRef.current.has(notification.id)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        dismissNotification(notification.id);
        timersRef.current.delete(notification.id);
      }, 5000);

      timersRef.current.set(notification.id, timeoutId);
    });

    return () => {
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, [dismissNotification, notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {notifications.map((notification) => (
        <section
          key={notification.id}
          className={[
            "pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur",
            toneClassName[notification.tone],
          ].join(" ")}
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {notification.title}
              </h2>
              {notification.description ? (
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  {notification.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissNotification(notification.id)}
              className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              aria-label={`Dismiss notification: ${notification.title}`}
            >
              Close
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
