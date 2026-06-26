import { jest } from "@jest/globals";
import { apiClient } from "@/api/axios";
import { listChats, listMessages } from "@/api/chat";
import type { ChatResponse, MessageResponse } from "@/types/chat";

describe("chat api", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists chats from the backend contract", async () => {
    const payload: ChatResponse[] = [
      {
        id: "chat-1",
        title: "Quarterly plan",
        created_at: "2026-06-25T12:00:00Z",
      },
    ];
    const getSpy = jest.spyOn(apiClient, "get").mockResolvedValue({
      data: payload,
    });

    await expect(listChats()).resolves.toEqual(payload);
    expect(getSpy).toHaveBeenCalledWith("/chats");
  });

  it("loads message history for a selected chat", async () => {
    const payload: MessageResponse[] = [
      {
        id: "msg-1",
        chat_id: "chat-1",
        role: "assistant",
        content: "Grounded answer",
        citations: [
          {
            document_id: "doc-1",
            source: "handbook.pdf",
            chunk_id: "doc-1::chunk::0",
            page: 2,
            snippet: "Handbook excerpt",
          },
        ],
        created_at: "2026-06-25T12:01:00Z",
      },
    ];
    const getSpy = jest.spyOn(apiClient, "get").mockResolvedValue({
      data: payload,
    });

    await expect(listMessages("chat-1")).resolves.toEqual(payload);
    expect(getSpy).toHaveBeenCalledWith("/chats/chat-1/messages");
  });
});
