import type { MessageResponse } from "@/types/chat";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: MessageResponse[];
  isLoading: boolean;
  streamingMessage?: MessageResponse | null;
};

export function MessageList({
  messages,
  isLoading,
  streamingMessage = null,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldStickToBottomRef.current) {
      return;
    }

    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: container.scrollHeight });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, streamingMessage?.content, streamingMessage?.citations]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom < 120;
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8 lg:px-8">
        <div className="h-28 rounded-[24px] border border-white/6 bg-[#1a2432] animate-pulse" />
        <div className="ml-auto h-24 w-[85%] rounded-[24px] border border-white/6 bg-[#263445] animate-pulse sm:w-[72%]" />
        <div className="h-32 rounded-[24px] border border-white/6 bg-[#1a2432] animate-pulse" />
      </div>
    );
  }

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-10 lg:px-8">
        <div className="w-full rounded-[24px] border border-white/6 bg-[var(--panel-soft)] px-5 py-6 text-center">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">
            Empty transcript
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">
            Conversation history will appear here
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            This chat route is connected and ready. Historical messages will
            populate this transcript area as soon as the backend returns them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8 lg:px-8">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {streamingMessage ? (
          <MessageBubble message={streamingMessage} isStreaming />
        ) : null}
      </div>
    </div>
  );
}
