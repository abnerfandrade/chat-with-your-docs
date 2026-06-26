import type { FormEvent, KeyboardEvent } from "react";
import { useChatDraftStore } from "@/stores/useChatDraftStore";

type ChatComposerProps = {
  isInputEnabled: boolean;
  isStreaming?: boolean;
  onSubmit: (message: string) => void;
};

export function ChatComposer({
  isInputEnabled,
  isStreaming = false,
  onSubmit,
}: ChatComposerProps) {
  const draft = useChatDraftStore((state) => state.draft);
  const setDraft = useChatDraftStore((state) => state.setDraft);
  const isSubmitDisabled =
    !isInputEnabled || isStreaming || draft.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSubmit(draft);
  }

  return (
    <div className="border-t border-white/6 bg-[rgba(17,27,40,0.9)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-3"
      >
        <label className="sr-only" htmlFor="chat-composer">
          Message composer
        </label>
        <textarea
          id="chat-composer"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!isInputEnabled || isStreaming}
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
            isInputEnabled
              ? "Ask about the indexed documents..."
              : "Upload and process at least one document to enable chat input."
          }
          className="w-full resize-none rounded-[24px] border border-white/10 bg-[#0f1722] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 disabled:cursor-not-allowed disabled:border-white/6 disabled:bg-black/10 disabled:text-slate-500 focus:border-[var(--accent)]"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {!isInputEnabled
              ? "Chat input unlocks after at least one document finishes processing."
              : isStreaming
                ? "The assistant is streaming a response. You can send the next turn when it finishes."
                : "Ask a grounded question and the answer will stream into the transcript."}
          </p>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b] disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-300 disabled:opacity-70"
          >
            {isStreaming ? "Streaming..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
