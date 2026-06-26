import type { ReactNode } from "react";
import { jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useChatStream } from "@/hooks/useChatStream";
import { createAppQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { MessageResponse } from "@/types/chat";

function createSseResponse(
  chunks: Array<{ delay: number; value: string }>,
  onChunk?: (value: string) => void,
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(({ delay, value }, index) => {
        const pushChunk = () => {
          onChunk?.(value);
          controller.enqueue(encoder.encode(value));
          if (index === chunks.length - 1) {
            controller.close();
          }
        };

        if (delay === 0) {
          pushChunk();
          return;
        }

        setTimeout(pushChunk, delay);
      });
    },
  });

  return {
    ok: true,
    body,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "text/event-stream" : null,
    },
    status: 200,
  } as Response;
}

describe("useChatStream", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses SSE events, seeds the transcript, and finalizes citations", async () => {
    const queryClient = createAppQueryClient();
    const onChatCreated = jest.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.spyOn(global, "fetch").mockResolvedValue(
      createSseResponse(
        [
          {
            delay: 0,
            value:
              'event: chat_id\ndata: {"chat_id":"chat-123"}\n\n' +
              'event: content\ndata: {"text":"The handbook says "}\n\n',
          },
          {
            delay: 10,
            value:
              'event: content\ndata: {"text":"rollouts start in July."}\n\n' +
              'event: citations\ndata: {"citations":[{"document_id":"doc-1","source":"handbook.pdf","chunk_id":"chunk-1","page":3,"snippet":"Rollouts begin in July."}]}\n\n' +
              "event: done\ndata: [DONE]\n\n",
          },
        ],
      ),
    );

    const { result } = renderHook(
      () => useChatStream({ chatId: undefined, onChatCreated }),
      { wrapper },
    );

    await act(async () => {
      await result.current.sendMessage("When do rollouts start?");
    });

    expect(onChatCreated).toHaveBeenCalledWith("chat-123");
    expect(result.current.isStreaming).toBe(false);
    expect(
      queryClient.getQueryData<MessageResponse[]>(
        queryKeys.chatMessages("chat-123"),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: "When do rollouts start?",
        }),
        expect.objectContaining({
          role: "assistant",
          content: "The handbook says rollouts start in July.",
          citations: [
            expect.objectContaining({
              source: "handbook.pdf",
              page: 3,
            }),
          ],
        }),
      ]),
    );
  });

  it("surfaces stream errors without appending an assistant message", async () => {
    const queryClient = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.spyOn(global, "fetch").mockResolvedValue(
      createSseResponse([
        {
          delay: 0,
          value:
            'event: chat_id\ndata: {"chat_id":"chat-500"}\n\n' +
            'event: error\ndata: {"error":"Failed to stream the assistant response."}\n\n',
        },
      ]),
    );

    const { result } = renderHook(
      () => useChatStream({ chatId: undefined }),
      { wrapper },
    );

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    await waitFor(() =>
      expect(result.current.error).toBe(
        "Failed to stream the assistant response.",
      ),
    );

    expect(
      queryClient.getQueryData<MessageResponse[]>(
        queryKeys.chatMessages("chat-500"),
      ),
    ).toEqual([
      expect.objectContaining({
        role: "user",
        content: "Hello",
      }),
    ]);
  });
});
