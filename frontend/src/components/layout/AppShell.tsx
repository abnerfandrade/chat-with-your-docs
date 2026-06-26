import { Outlet, useLocation } from "react-router-dom";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

function getShellMeta(pathname: string) {
  if (pathname.startsWith("/documents")) {
    return {
      eyebrow: "Corpus management",
      title: "Documents",
      description: "Upload source material and inspect the shared knowledge base.",
    };
  }

  if (pathname.startsWith("/chat/")) {
    return {
      eyebrow: "Conversation workspace",
      title: "Active chat",
      description: "Reopen a previous conversation while keeping navigation nearby.",
    };
  }

  return {
    eyebrow: "Conversation workspace",
    title: "Chats",
    description: "Start a new retrieval-grounded conversation from the default route.",
  };
}

export function AppShell() {
  const location = useLocation();
  const isMobileSidebarOpen = useSidebarStore(
    (state) => state.isMobileSidebarOpen,
  );
  const openMobileSidebar = useSidebarStore((state) => state.openMobileSidebar);
  const clearDraft = useChatDraftStore((state) => state.clearDraft);
  const meta = getShellMeta(location.pathname);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_1fr]">
      <a
        href="#app-main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded-2xl bg-[#223246] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)]"
      >
        Skip to main content
      </a>
      <aside className="hidden h-screen border-r border-white/6 bg-[var(--sidebar)] shadow-[10px_0_30px_rgba(0,0,0,0.22)] lg:block">
        <Sidebar onNewChat={clearDraft} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(15,23,34,0.88)] px-4 py-4 backdrop-blur lg:px-7">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
                {meta.eyebrow}
              </p>
              <h1 className="mt-1 text-lg font-semibold text-white">
                {meta.title}
              </h1>
              <p className="mt-1 hidden text-sm text-slate-400 sm:block">
                {meta.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openMobileSidebar}
                aria-expanded={isMobileSidebarOpen}
                aria-controls="mobile-navigation-menu"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
              >
                Menu
              </button>
              <span className="hidden rounded-full border border-white/10 bg-[var(--panel-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 sm:inline-flex">
                v1 shell
              </span>
            </div>
          </div>
        </header>

        <main id="app-main-content" className="px-4 py-4 lg:px-7 lg:py-6">
          <div className="mx-auto max-w-7xl">
            <div className="min-h-[calc(100vh-7.5rem)] overflow-hidden rounded-[28px] border border-white/6 bg-[var(--panel)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <MobileSidebar />
      <NotificationCenter />
    </div>
  );
}
