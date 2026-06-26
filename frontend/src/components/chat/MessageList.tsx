import type { MessageResponse } from "@/types/chat";
import { useEffect, useRef } from "react";
import { StatePanel } from "@/components/layout/StatePanel";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: MessageResponse[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  streamingMessage?: MessageResponse | null;
};

export function MessageList({
  messages,
  isLoading,
  isError = false,
  errorMessage,
  onRetry,
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
      <div
        className="flex flex-col gap-[14px] px-6 py-[22px]"
        role="status"
        aria-live="polite"
        aria-label="Loading transcript"
      >
        <span className="sr-only">Loading transcript</span>
        <div className="h-28 max-w-[780px] rounded-[18px] border border-[var(--line)] bg-[var(--assistant)] animate-pulse" />
        <div className="ml-auto h-24 w-[85%] max-w-[780px] rounded-[18px] border border-[var(--line)] bg-[var(--user)] animate-pulse sm:w-[72%]" />
        <div className="h-32 max-w-[780px] rounded-[18px] border border-[var(--line)] bg-[var(--assistant)] animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div role="alert" className="w-full max-w-[780px]">
          <StatePanel
            eyebrow="Transcript unavailable"
            title="We couldn't load this conversation"
            description={
              errorMessage ??
              "The transcript request did not complete. Try again to restore the full message history."
            }
            tone="error"
            align="left"
            actions={
              onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-[12px] border-0 bg-[var(--accent)] px-4 py-[10px] text-[0.84rem] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Retry loading transcript
                </button>
              ) : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <StatePanel
          eyebrow="Empty transcript"
          title="Conversation history will appear here"
          description="This chat route is connected and ready. Historical messages will populate this transcript area as soon as the backend returns them."
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
      aria-busy={isLoading || Boolean(streamingMessage)}
    >
      <div className="flex flex-col gap-[14px] px-6 py-[22px] pb-6">
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
