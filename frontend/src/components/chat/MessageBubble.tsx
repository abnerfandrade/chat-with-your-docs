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
        "max-w-3xl rounded-[24px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-5",
        isUser
          ? "ml-auto border-white/8 bg-[#263445]"
          : "mr-auto border-white/6 bg-[#1a2432]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-slate-400">
          {isUser ? "You" : isStreaming ? "Assistant streaming" : "Assistant"}
        </p>
        <time
          dateTime={message.created_at}
          className="text-xs text-slate-500"
        >
          {formatTimestamp(message.created_at)}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">
        {message.content}
      </p>
      {!isUser && isStreaming ? (
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
          Streaming response…
        </p>
      ) : null}
      {!isUser ? <CitationList citations={message.citations} /> : null}
    </article>
  );
}
