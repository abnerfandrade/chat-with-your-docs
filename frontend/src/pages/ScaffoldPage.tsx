import { useMemo } from "react";
import { apiClient } from "@/api/axios";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { useSidebarStore } from "@/stores/useSidebarStore";

const statusItems = [
  "React 19 + TypeScript",
  "TanStack Query",
  "React Router",
  "Zustand",
  "Axios",
  "Tailwind CSS",
  "Jest + RTL + MSW",
];

export function ScaffoldPage() {
  const draft = useChatDraftStore((state) => state.draft);
  const setDraft = useChatDraftStore((state) => state.setDraft);
  const clearDraft = useChatDraftStore((state) => state.clearDraft);
  const isMobileSidebarOpen = useSidebarStore(
    (state) => state.isMobileSidebarOpen,
  );
  const toggleMobileSidebar = useSidebarStore(
    (state) => state.toggleMobileSidebar,
  );

  const apiUrl = useMemo(
    () => String(apiClient.defaults.baseURL ?? "http://localhost:8000"),
    [],
  );

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-[28px] border border-white/8 bg-[var(--panel)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--accent)]">
                F01 Frontend scaffold
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  The frontend foundation is wired and ready for the real app
                  shell.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                  This screen is intentionally temporary. It proves the scaffold
                  boots with the chosen libraries while we keep the actual chat
                  and documents UX for the next implementation steps.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/8 bg-white/4 p-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/6 bg-black/12 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Router + state
                </p>
                <p className="mt-2 text-sm text-slate-100">
                  Mobile sidebar is currently{" "}
                  <strong>
                    {isMobileSidebarOpen ? "open" : "closed"}
                  </strong>
                  .
                </p>
                <button
                  type="button"
                  onClick={toggleMobileSidebar}
                  className="mt-4 inline-flex rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3f57]"
                >
                  Toggle scaffold state
                </button>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/12 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  API baseline
                </p>
                <p className="mt-2 break-all text-sm text-slate-100">
                  Axios base URL: <strong>{apiUrl}</strong>
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Default timeout and JSON headers are configured in the shared
                  client.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-[#121b27] p-5">
            <div className="rounded-[20px] border border-white/8 bg-[#162131] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Draft store preview
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Composer state lives in Zustand
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--muted)]">
                  Placeholder UI
                </span>
              </div>

              <label className="mt-5 block text-sm text-slate-200">
                Starter prompt
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={5}
                  placeholder="Ask about the indexed documents..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1722] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[var(--accent)]"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Clear draft
                </button>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm text-[var(--muted)]">
                  Next step: replace this with the real `ChatPage`
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
