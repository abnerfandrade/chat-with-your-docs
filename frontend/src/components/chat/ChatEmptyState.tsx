import { Link } from "react-router-dom";

type ChatEmptyStateProps = {
  hasCompletedDocuments: boolean;
  isCheckingDocuments: boolean;
  onSelectPrompt: (prompt: string) => void;
};

const starterPrompts = [
  "Summarize the main themes across the uploaded documents.",
  "Find the sections that mention policy updates or process changes.",
  "List the most important deadlines or milestones in the corpus.",
];

export function ChatEmptyState({
  hasCompletedDocuments,
  isCheckingDocuments,
  onSelectPrompt,
}: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-10 lg:px-8">
      <div className="w-full rounded-[28px] border border-white/6 bg-[var(--panel-soft)] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-8">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-400">
          Fresh chat
        </span>
        <h3 className="mt-4 text-2xl font-semibold text-white">
          Start a new conversation
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Ask grounded questions against the shared document corpus. The
          transcript will appear here once a conversation begins.
        </p>

        {isCheckingDocuments ? (
          <div className="mt-8 rounded-[22px] border border-dashed border-white/10 bg-black/10 px-5 py-6 text-sm text-slate-400">
            Checking whether the corpus is ready for chat…
          </div>
        ) : hasCompletedDocuments ? (
          <div className="mt-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">
              Starter prompts
            </p>
            <div className="mt-4 grid gap-3 text-left">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSelectPrompt(prompt)}
                  className="rounded-[22px] border border-white/10 bg-black/12 px-4 py-4 text-sm leading-6 text-slate-200 transition hover:border-white/16 hover:bg-white/6"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[var(--accent)]/35 bg-[var(--accent-soft)] px-5 py-6 text-left">
            <p className="text-sm font-semibold text-slate-100">
              Upload documents before starting the first chat.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Once at least one document finishes processing, this page will
              swap the setup CTA for starter prompts and the full transcript
              flow.
            </p>
            <Link
              to="/documents"
              className="mt-4 inline-flex rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b]"
            >
              Open documents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
