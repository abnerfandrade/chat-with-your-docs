import { StatePanel } from "@/components/layout/StatePanel";

type ChatEmptyStateProps = {
  isDocumentsError?: boolean;
  documentsErrorMessage?: string;
  onRetryDocuments?: () => void;
};

export function ChatEmptyState({
  isDocumentsError = false,
  documentsErrorMessage,
  onRetryDocuments,
}: ChatEmptyStateProps) {
  if (isDocumentsError) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-1 items-center justify-center px-6 py-10">
        <div role="alert" className="w-full">
          <StatePanel
            eyebrow="Corpus status unavailable"
            title="We couldn't load the current corpus status"
            description={
              documentsErrorMessage ??
              "The documents request failed. You can still start a chat, but starter prompts and corpus status may be incomplete until this check works again."
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
          Start a conversation at any time. If documents are available, the
          assistant can use them for grounded answers and citations. The
          transcript will appear here once a conversation begins.
        </p>
      </div>
    </div>
  );
}
