import type { MessageResponse } from "@/types/chat";
import { CitationList } from "./CitationList";

type MessageBubbleProps = {
  message: MessageResponse;
  isStreaming?: boolean;
};

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "max-w-[780px] rounded-[18px] border px-[18px] py-4 leading-[1.65] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        isUser
          ? "ml-auto border-[var(--line)] bg-[var(--user)]"
          : "mr-auto border-[var(--line)] bg-[var(--assistant)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[0.74rem] uppercase tracking-[0.08em] text-[var(--muted)]">
          {isUser ? "You" : isStreaming ? "Assistant streaming" : "Assistant"}
        </p>
        <time
          dateTime={message.created_at}
          className="text-[0.74rem] text-slate-500"
        >
          {formatTimestamp(message.created_at)}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[0.94rem] text-slate-100">
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
