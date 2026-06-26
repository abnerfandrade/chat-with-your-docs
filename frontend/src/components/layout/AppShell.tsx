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
      <aside className="relative hidden h-screen border-r border-white/6 bg-[var(--sidebar)] shadow-[var(--sidebar-shadow)] lg:block">
        <Sidebar onNewChat={clearDraft} />
      </aside>

      <div className="min-w-0">
        <header className="border-b border-white/6 bg-[rgba(15,23,34,0.88)] px-6 py-[18px] backdrop-blur lg:px-7">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#7f95b8]">
                {meta.eyebrow}
              </p>
              <h1 className="mt-2 text-[1.05rem] font-semibold text-white">
                {meta.title}
              </h1>
              <p className="mt-2 hidden text-[0.92rem] text-[var(--muted)] sm:block">
                {meta.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openMobileSidebar}
                aria-expanded={isMobileSidebarOpen}
                aria-controls="mobile-navigation-menu"
                className="inline-flex items-center rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
              >
                Menu
              </button>
              <span className="hidden rounded-full border border-[var(--line)] bg-[#223044] px-3 py-1 text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] sm:inline-flex">
                v1 shell
              </span>
            </div>
          </div>
        </header>

        <main id="app-main-content" className="bg-[linear-gradient(180deg,rgba(255,255,255,0.01),transparent)] px-6 py-6 lg:px-7">
          <div className="mx-auto max-w-[1280px]">
            <div className="h-[calc(100vh-8.3rem)] min-h-[640px] overflow-hidden rounded-[24px] border border-white/6 bg-[var(--panel)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),var(--shadow)]">
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
