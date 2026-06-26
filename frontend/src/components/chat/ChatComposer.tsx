import type { FormEvent, KeyboardEvent } from "react";
import { useChatDraftStore } from "@/stores/useChatDraftStore";

type ChatComposerProps = {
  hasCompletedDocuments?: boolean;
  isStreaming?: boolean;
  onSubmit: (message: string) => void;
};

export function ChatComposer({
  hasCompletedDocuments = false,
  isStreaming = false,
  onSubmit,
}: ChatComposerProps) {
  const draft = useChatDraftStore((state) => state.draft);
  const setDraft = useChatDraftStore((state) => state.setDraft);
  const isSubmitDisabled = isStreaming || draft.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSubmit(draft);
  }

  return (
    <div className="border-t border-[var(--line)] bg-[linear-gradient(180deg,rgba(24,34,48,0.4),#182230_30%)] px-6 pb-6 pt-[18px]">
      <form onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-composer">
          Message composer
        </label>
        <div className="flex items-end gap-3 rounded-[20px] border border-[var(--line-strong)] bg-[#131d2a] p-3">
          <textarea
            id="chat-composer"
            aria-describedby="chat-composer-help"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isStreaming}
            rows={4}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!isSubmitDisabled) {
                  onSubmit(draft);
                }
              }
            }}
            placeholder={
              hasCompletedDocuments
                ? "Ask a follow-up question about the uploaded sources..."
                : "Ask a question. If no documents are ready yet, the assistant may say it does not have enough information."
            }
            className="min-h-[84px] flex-1 resize-none border-0 bg-transparent px-3 py-[10px] text-[0.92rem] leading-[1.6] text-[var(--muted)] outline-none transition placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="rounded-[14px] border-0 bg-[#7cc7c0] px-4 py-[11px] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[#243245] disabled:text-[var(--muted)]"
          >
            {isStreaming ? "Streaming..." : "Send"}
          </button>
        </div>
        <p id="chat-composer-help" className="mt-[10px] text-[0.8rem] text-[var(--muted)]">
          {isStreaming
              ? "The assistant is streaming a response. You can send the next turn when it finishes."
              : hasCompletedDocuments
                ? "Active chat view stays minimal. Large intro content should only appear in an empty state."
                : "You can start the conversation without documents, but grounded answers depend on uploaded sources."}
        </p>
      </form>
    </div>
  );
}
