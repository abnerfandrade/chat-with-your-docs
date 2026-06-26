import { Outlet } from "react-router-dom";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const isMobileSidebarOpen = useSidebarStore(
    (state) => state.isMobileSidebarOpen,
  );
  const openMobileSidebar = useSidebarStore((state) => state.openMobileSidebar);
  const clearDraft = useChatDraftStore((state) => state.clearDraft);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_1fr]">
      <a
        href="#app-main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded-2xl bg-[#223246] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)]"
      >
        Skip to main content
      </a>

      <aside className="relative hidden h-screen border-r border-white/6 bg-[var(--sidebar)] shadow-[var(--sidebar-shadow)] lg:block">
        <Sidebar onNewChat={clearDraft} />
      </aside>

      <main
        id="app-main-content"
        className="min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),transparent)] p-6 pl-7"
      >
        <div className="h-[calc(100vh-48px)] overflow-hidden rounded-[24px] border border-white/5 bg-[var(--panel)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),var(--shadow)]">
          <Outlet />
        </div>

        {/* Mobile menu trigger — visible only on small screens */}
        <button
          type="button"
          onClick={openMobileSidebar}
          aria-expanded={isMobileSidebarOpen}
          aria-controls="mobile-navigation-menu"
          className="fixed right-4 top-4 z-30 inline-flex items-center rounded-[14px] border border-white/10 bg-[rgba(15,23,34,0.88)] px-3 py-2 text-sm font-medium text-slate-100 backdrop-blur transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
        >
          Menu
        </button>
      </main>

      <MobileSidebar />
      <NotificationCenter />
    </div>
  );
}
