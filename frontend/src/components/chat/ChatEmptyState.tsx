import { Link } from "react-router-dom";
import { StatePanel } from "@/components/layout/StatePanel";

type ChatEmptyStateProps = {
  hasCompletedDocuments: boolean;
  isCheckingDocuments: boolean;
  isDocumentsError?: boolean;
  documentsErrorMessage?: string;
  onSelectPrompt: (prompt: string) => void;
  onRetryDocuments?: () => void;
};

const starterPrompts = [
  "Summarize the main themes across the uploaded documents.",
  "Find the sections that mention policy updates or process changes.",
  "List the most important deadlines or milestones in the corpus.",
];

export function ChatEmptyState({
  hasCompletedDocuments,
  isCheckingDocuments,
  isDocumentsError = false,
  documentsErrorMessage,
  onSelectPrompt,
  onRetryDocuments,
}: ChatEmptyStateProps) {
  if (isDocumentsError) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-1 items-center justify-center px-6 py-10">
        <div role="alert" className="w-full">
          <StatePanel
            eyebrow="Corpus status unavailable"
            title="We couldn't confirm whether chat is ready"
            description={
              documentsErrorMessage ??
              "The corpus readiness check failed. Retry to restore starter prompts and composer state."
            }
            tone="error"
            align="left"
            actions={
              <>
                {onRetryDocuments ? (
                  <button
                    type="button"
                    onClick={onRetryDocuments}
                    className="rounded-[12px] border-0 bg-[var(--accent)] px-4 py-[10px] text-[0.84rem] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    Retry corpus check
                  </button>
                ) : null}
                <Link
                  to="/documents"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Open documents
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-[44rem] rounded-[24px] border border-[var(--line)] bg-[#243245] px-8 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <span className="inline-flex rounded-full border border-[var(--line)] bg-[#2a384d] px-4 py-[7px] font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#8ba2c6]">
          Fresh chat
        </span>
        <h3 className="mt-5 text-[1.05rem] font-semibold text-white sm:text-[1.2rem] lg:text-[1.05rem]">
          Start a new conversation
        </h3>
        <p className="mx-auto mt-4 max-w-[34rem] text-[0.82rem] leading-8 text-[#8ea0b8] sm:text-[0.9rem]">
          Ask grounded questions against the shared document corpus. The
          transcript will appear here once a conversation begins.
        </p>

        {isCheckingDocuments ? (
          <div
            className="mt-8 rounded-[18px] border border-dashed border-[var(--line)] bg-[#202c3c] px-5 py-6 text-[0.84rem] text-[var(--muted)]"
            role="status"
            aria-live="polite"
          >
            Checking whether the corpus is ready for chat…
          </div>
        ) : hasCompletedDocuments ? (
          <div className="mt-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#8ba2c6]">
              Starter prompts
            </p>
            <div className="mt-4 grid gap-3 text-left">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSelectPrompt(prompt)}
                  className="rounded-[18px] border border-[var(--line)] bg-[#202c3c] px-4 py-4 text-[0.84rem] leading-7 text-[#d7e3f4] transition hover:bg-[#243245] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[18px] border border-dashed border-[var(--line-strong)] bg-[#202c3c] px-5 py-6 text-left">
            <p className="text-[0.9rem] font-semibold text-slate-100">
              Upload documents before starting the first chat.
            </p>
            <p className="mt-2 text-[0.84rem] leading-7 text-[#9ab0c9]">
              Once at least one document finishes processing, this page will
              swap the setup CTA for starter prompts and the full transcript
              flow.
            </p>
            <Link
              to="/documents"
              className="mt-4 inline-flex rounded-[12px] border border-white/10 bg-[#223246] px-4 py-[10px] text-[0.84rem] font-semibold text-white transition hover:bg-[#29405b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Open documents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
