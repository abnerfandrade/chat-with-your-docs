import type { ReactNode } from "react";
import { jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/api/axios";
import { useChatMessages } from "@/hooks/useChatMessages";
import { createAppQueryClient } from "@/lib/queryClient";

describe("useChatMessages", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches messages when a chat id is present", async () => {
    const getSpy = jest.spyOn(apiClient, "get").mockResolvedValue({
      data: [
        {
          id: "msg-1",
          chat_id: "chat-1",
          role: "assistant",
          content: "Grounded answer",
          citations: [],
          created_at: "2026-06-25T12:01:00Z",
        },
      ],
    } as Awaited<ReturnType<typeof apiClient.get>>);

    const queryClient = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChatMessages("chat-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith("/chats/chat-1/messages");
    expect(result.current.data?.[0]?.content).toBe("Grounded answer");
  });

  it("does not fetch messages without a selected chat id", async () => {
    const getSpy = jest.spyOn(apiClient, "get");
    const queryClient = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChatMessages(undefined), {
      wrapper,
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));

    expect(getSpy).not.toHaveBeenCalled();
  });
});
