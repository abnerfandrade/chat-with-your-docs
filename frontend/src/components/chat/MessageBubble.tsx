import type { MessageResponse } from "@/types/chat";
import { CitationList } from "./CitationList";

type MessageBubbleProps = {
  message: MessageResponse;
  isStreaming?: boolean;
};

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "max-w-[780px] rounded-[18px] border border-[var(--line)] px-[18px] py-4 leading-[1.65]",
        isUser
          ? "self-end bg-[var(--user)]"
          : "self-start bg-[var(--assistant)]",
      ].join(" ")}
    >
      <div className="message-label mb-2 font-mono text-[0.74rem] uppercase tracking-[0.08em] text-[var(--muted)]">
        {isUser ? "User" : "Assistant"}
      </div>
      <p className="whitespace-pre-wrap text-[0.94rem] text-slate-100">
        {message.content}
      </p>
      {!isUser && isStreaming ? (
        <p className="mt-3 text-[0.74rem] uppercase tracking-[0.12em] text-[var(--accent)]">
          Streaming response…
        </p>
      ) : null}
      {!isUser ? <CitationList citations={message.citations} /> : null}
    </article>
  );
}
