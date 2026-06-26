import { useSidebarStore } from "@/stores/useSidebarStore";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { Sidebar } from "./Sidebar";

export function MobileSidebar() {
  const isMobileSidebarOpen = useSidebarStore(
    (state) => state.isMobileSidebarOpen,
  );
  const closeMobileSidebar = useSidebarStore(
    (state) => state.closeMobileSidebar,
  );
  const clearDraft = useChatDraftStore((state) => state.clearDraft);

  if (!isMobileSidebarOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation overlay"
        onClick={closeMobileSidebar}
        className="absolute inset-0 bg-[#08111bcc] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] border-r border-white/8 bg-[var(--sidebar)] shadow-[10px_0_30px_rgba(0,0,0,0.3)]"
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/8"
          >
            Close
          </button>
        </div>
        <Sidebar onNavigate={closeMobileSidebar} onNewChat={clearDraft} />
      </div>
    </div>
  );
}
