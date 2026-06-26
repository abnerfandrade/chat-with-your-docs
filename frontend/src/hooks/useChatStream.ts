import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/api/axios";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ChatStreamEvent,
  CitationResponse,
  MessageResponse,
} from "@/types/chat";

type UseChatStreamOptions = {
  chatId: string | undefined;
  onChatCreated?: (chatId: string) => void;
};

type UseChatStreamResult = {
  error: string | null;
  isStreaming: boolean;
  sendMessage: (message: string) => Promise<void>;
  streamingMessage: MessageResponse | null;
};

function createTransientMessage(
  role: "user" | "assistant",
  content: string,
  chatId: string,
  citations: CitationResponse[] = [],
) {
  return {
    id: `local-${role}-${crypto.randomUUID()}`,
    chat_id: chatId,
    role,
    content,
    citations,
    created_at: new Date().toISOString(),
  } satisfies MessageResponse;
}

function parseSseEvent(block: string): ChatStreamEvent | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let eventName = "";
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      return;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  });

  if (!eventName || dataLines.length === 0) {
    return null;
  }

  if (eventName === "done") {
    return {
      event: "done",
      data: dataLines.join("\n") as "[DONE]",
    };
  }

  return {
    event: eventName as ChatStreamEvent["event"],
    data: JSON.parse(dataLines.join("\n")) as Exclude<ChatStreamEvent, { event: "done" }>["data"],
  } as ChatStreamEvent;
}

export function useChatStream({
  chatId,
  onChatCreated,
}: UseChatStreamOptions): UseChatStreamResult {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<MessageResponse | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeChatIdRef = useRef<string | undefined>(chatId);
  const seededUserMessageRef = useRef<MessageResponse | null>(null);

  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  async function sendMessage(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isStreaming) {
      return;
    }

    setError(null);
    setIsStreaming(true);
    setStreamingMessage(null);

    const requestChatId = activeChatIdRef.current ?? null;
    const optimisticUserMessage = requestChatId
      ? createTransientMessage("user", trimmedMessage, requestChatId)
      : null;

    if (requestChatId && optimisticUserMessage) {
      queryClient.setQueryData<MessageResponse[] | undefined>(
        queryKeys.chatMessages(requestChatId),
        (current) => [...(current ?? []), optimisticUserMessage],
      );
      seededUserMessageRef.current = optimisticUserMessage;
    } else {
      seededUserMessageRef.current = null;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let resolvedChatId = requestChatId;
    let streamedText = "";
    let resolvedCitations: CitationResponse[] = [];
    let didReceiveDone = false;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          chat_id: requestChatId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to open the chat stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        chunks.forEach((chunk) => {
          const event = parseSseEvent(chunk);
          if (!event) {
            return;
          }

          if (event.event === "chat_id") {
            resolvedChatId = event.data.chat_id;
            activeChatIdRef.current = resolvedChatId;
            if (!seededUserMessageRef.current) {
              const seededUserMessage = createTransientMessage(
                "user",
                trimmedMessage,
                resolvedChatId,
              );
              seededUserMessageRef.current = seededUserMessage;
              queryClient.setQueryData<MessageResponse[] | undefined>(
                queryKeys.chatMessages(resolvedChatId),
                [seededUserMessage],
              );
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.chats });
            if (chatId !== resolvedChatId) {
              onChatCreated?.(resolvedChatId);
            }
            return;
          }

          if (event.event === "content") {
            const nextChatId = resolvedChatId ?? activeChatIdRef.current ?? "pending-chat";
            streamedText += event.data.text;
            setStreamingMessage((current) =>
              current
                ? { ...current, content: current.content + event.data.text }
                : createTransientMessage("assistant", event.data.text, nextChatId),
            );
            return;
          }

          if (event.event === "citations") {
            resolvedCitations = event.data.citations;
            setStreamingMessage((current) =>
              current ? { ...current, citations: event.data.citations } : current,
            );
            return;
          }

          if (event.event === "error") {
            setError(event.data.error);
          }

          if (event.event === "done") {
            didReceiveDone = true;
          }
        });
      }

      const trailingEvent = parseSseEvent(buffer);
      if (trailingEvent?.event === "done") {
        didReceiveDone = true;
      }

      if (didReceiveDone && resolvedChatId) {
        const assistantMessage = createTransientMessage(
          "assistant",
          streamedText,
          resolvedChatId,
          resolvedCitations,
        );
        queryClient.setQueryData<MessageResponse[] | undefined>(
          queryKeys.chatMessages(resolvedChatId),
          (current) => [...(current ?? []), assistantMessage],
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.chatMessages(resolvedChatId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      }
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === "AbortError"
      ) {
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to stream the assistant response.",
      );
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      setStreamingMessage(null);
    }
  }

  return {
    error,
    isStreaming,
    sendMessage,
    streamingMessage,
  };
}
