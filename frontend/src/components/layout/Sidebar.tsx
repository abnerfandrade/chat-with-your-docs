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
    <div className="relative flex h-full flex-col gap-[18px] bg-[var(--sidebar)] px-4 py-[18px] text-[#f3f3f1]">
      <div
        className="absolute inset-y-0 right-[-1px] w-px bg-[rgba(124,199,192,0.18)]"
        aria-hidden="true"
      />

      <div className="px-3 pt-[10px] pb-[2px]">
        <strong className="block text-[0.95rem] font-bold">
          Chat With Your Docs
        </strong>
        <span className="mt-[6px] block text-[0.8rem] text-[rgba(243,243,241,0.56)]">
          Minimal layout preview
        </span>
      </div>

      <button
        type="button"
        onClick={handleNewChat}
        className="cursor-pointer w-full rounded-[14px] border border-white/10 bg-[#223246] px-[14px] py-3 text-left font-semibold text-[#f8f8f6] transition hover:bg-[#29405b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        + New chat
      </button>

      <div className="px-[10px]">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[rgba(243,243,241,0.46)]">
          Navigation
        </p>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SidebarChatList onNavigate={onNavigate} />
      </div>
    </div>
  );
}
