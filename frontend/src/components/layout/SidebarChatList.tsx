import { NavLink } from "react-router-dom";
import { useChats } from "@/hooks/useChats";
import { StatePanel } from "./StatePanel";

type SidebarChatListProps = {
  onNavigate?: () => void;
};

function formatChatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function SidebarChatList({ onNavigate }: SidebarChatListProps) {
  const { data: chatsData, error, isError, isLoading, refetch } = useChats();
  const chats = Array.isArray(chatsData) ? chatsData : [];

  return (
    <section aria-labelledby="recent-chats-heading" className="min-h-0">
      <div className="px-2">
        <h2
          id="recent-chats-heading"
          className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500"
        >
          Recent chats
        </h2>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {isLoading ? (
          <div role="status" aria-live="polite" aria-label="Loading recent chats">
            <span className="sr-only">Loading recent chats</span>
            <div className="h-16 rounded-2xl border border-white/6 bg-white/5 animate-pulse" />
            <div className="h-16 rounded-2xl border border-white/6 bg-white/5 animate-pulse" />
            <div className="h-16 rounded-2xl border border-white/6 bg-white/5 animate-pulse" />
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div role="alert">
            <StatePanel
              eyebrow="Recent chats"
              title="We couldn't load chat history"
              description={
                error instanceof Error
                  ? error.message
                  : "Try again to restore the recent conversation list."
              }
              tone="error"
              align="left"
              actions={
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Retry history
                </button>
              }
            />
          </div>
        ) : null}

        {!isLoading && !isError && chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/8 bg-black/12 px-4 py-4 text-sm leading-6 text-slate-400">
            Previous conversations will appear here once a chat has been created.
          </div>
        ) : null}

        {!isLoading && !isError
          ? chats.map((chat) => (
              <NavLink
                key={chat.id}
                to={`/chat/${chat.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    "rounded-2xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                    isActive
                      ? "border-white/10 bg-white/10 shadow-[inset_3px_0_0_rgba(124,199,192,0.55)]"
                      : "border-transparent hover:bg-white/6",
                  ].join(" ")
                }
              >
                <strong className="block truncate text-sm font-semibold text-slate-100">
                  {chat.title}
                </strong>
                <span className="mt-1.5 block text-sm leading-6 text-slate-400">
                  Created {formatChatTimestamp(chat.created_at)}
                </span>
              </NavLink>
            ))
          : null}
      </div>
    </section>
  );
}
