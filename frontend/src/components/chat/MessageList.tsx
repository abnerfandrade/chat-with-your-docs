import type { MessageResponse } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: MessageResponse[];
  isLoading: boolean;
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8 lg:px-8">
        <div className="h-28 rounded-[24px] border border-white/6 bg-[#1a2432] animate-pulse" />
        <div className="ml-auto h-24 w-[85%] rounded-[24px] border border-white/6 bg-[#263445] animate-pulse sm:w-[72%]" />
        <div className="h-32 rounded-[24px] border border-white/6 bg-[#1a2432] animate-pulse" />
      </div>
    );
  }

  if (messages.length === 0) {
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8 lg:px-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
