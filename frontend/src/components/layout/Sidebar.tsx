import { useNavigate } from "react-router-dom";
import { SidebarNav } from "./SidebarNav";
import { SidebarChatList } from "./SidebarChatList";

type SidebarProps = {
  onNavigate?: () => void;
  onNewChat?: () => void;
};

export function Sidebar({ onNavigate, onNewChat }: SidebarProps) {
  const navigate = useNavigate();

  function handleNewChat() {
    onNewChat?.();
    navigate("/chat");
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col gap-5 bg-[var(--sidebar)] px-4 py-5 text-slate-100">
      <div className="px-2">
        <strong className="block text-[0.95rem] font-semibold">
          Chat With Your Docs
        </strong>
        <span className="mt-1.5 block text-sm leading-6 text-slate-400">
          Shared retrieval workspace for document-grounded conversations.
        </span>
      </div>

      <button
        type="button"
        onClick={handleNewChat}
        className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-3 text-left text-sm font-semibold text-slate-50 transition hover:bg-[#29405b]"
      >
        New chat
      </button>

      <div className="px-2">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SidebarChatList onNavigate={onNavigate} />
      </div>

      <footer className="border-t border-white/8 px-2 pt-4 text-sm leading-6 text-slate-500">
        Frontend foundation is ready. Next steps will replace placeholder page
        content with real chat and document flows.
      </footer>
    </div>
  );
}
