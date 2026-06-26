import { useParams } from "react-router-dom";

export function ChatPage() {
  const { chatId } = useParams();

  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] grid-rows-[auto_1fr_auto]">
      <header className="border-b border-white/6 px-6 py-5 lg:px-8">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
          Chat route
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {chatId ? "Active chat" : "Start a new conversation"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          {chatId
            ? "This route is ready for historical messages and streaming state in the next step."
            : "This route is ready for the empty state, transcript region, and composer shell in the next step."}
        </p>
      </header>

      <div className="flex items-center px-6 py-8 lg:px-8">
        <div className="w-full rounded-[24px] border border-white/6 bg-[var(--panel-soft)] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Placeholder content
            </span>
            {chatId ? (
              <span className="rounded-full border border-[var(--line)] bg-black/15 px-3 py-1 text-sm text-slate-300">
                Chat ID: {chatId}
              </span>
            ) : (
              <span className="rounded-full border border-[var(--line)] bg-black/15 px-3 py-1 text-sm text-slate-300">
                No persisted chat selected yet
              </span>
            )}
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            The shell, routing, and navigation are now in place. `F04` will
            replace this area with the actual chat header, transcript, and
            composer.
          </p>
        </div>
      </div>

      <div className="border-t border-white/6 px-6 py-4 lg:px-8">
        <div className="rounded-[20px] border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-slate-500">
          Composer shell arrives in the next frontend step.
        </div>
      </div>
    </section>
  );
}
