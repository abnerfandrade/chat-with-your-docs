import { useChatDraftStore } from "@/stores/useChatDraftStore";

type ChatComposerProps = {
  isInputEnabled: boolean;
};

export function ChatComposer({ isInputEnabled }: ChatComposerProps) {
  const draft = useChatDraftStore((state) => state.draft);
  const setDraft = useChatDraftStore((state) => state.setDraft);

  return (
    <div className="border-t border-white/6 bg-[rgba(17,27,40,0.9)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="mx-auto flex w-full max-w-3xl flex-col gap-3"
      >
        <label className="sr-only" htmlFor="chat-composer">
          Message composer
        </label>
        <textarea
          id="chat-composer"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!isInputEnabled}
          rows={4}
          placeholder={
            isInputEnabled
              ? "Ask about the indexed documents..."
              : "Upload and process at least one document to enable chat input."
          }
          className="w-full resize-none rounded-[24px] border border-white/10 bg-[#0f1722] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 disabled:cursor-not-allowed disabled:border-white/6 disabled:bg-black/10 disabled:text-slate-500 focus:border-[var(--accent)]"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {isInputEnabled
              ? "Composer shell is live. Sending and streaming arrive in the next steps."
              : "Chat input unlocks after at least one document finishes processing."}
          </p>
          <button
            type="submit"
            disabled
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
