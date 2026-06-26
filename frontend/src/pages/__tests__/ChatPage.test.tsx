import { jest } from "@jest/globals";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { apiClient } from "@/api/axios";
import { createAppQueryClient } from "@/lib/queryClient";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import type { MessageResponse } from "@/types/chat";
import { renderWithProviders, screen } from "../../../tests/setup/test-utils";

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

describe("ChatPage", () => {
  beforeEach(() => {
    useChatDraftStore.setState({ draft: "" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps chat available when no completed documents are available", async () => {
    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat" });

    expect(
      await screen.findByRole("heading", {
        name: /start a new conversation/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/message composer/i)).toBeEnabled();
  });

  it("shows the same empty state when completed documents exist", async () => {
    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [
            {
              id: "doc-1",
              filename: "handbook.pdf",
              content_type: "application/pdf",
              size_bytes: 2048,
              status: "completed",
              error_message: null,
              created_at: "2026-06-25T12:00:00Z",
              updated_at: "2026-06-25T12:05:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat" });

    expect(
      await screen.findByRole("heading", {
        name: /start a new conversation/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/message composer/i)).toBeEnabled();
  });

  it("renders historical messages on an existing chat route", async () => {
    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [
            {
              id: "doc-1",
              filename: "handbook.pdf",
              content_type: "application/pdf",
              size_bytes: 2048,
              status: "completed",
              error_message: null,
              created_at: "2026-06-25T12:00:00Z",
              updated_at: "2026-06-25T12:05:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      if (url === "/chats/quarterly-plan/messages") {
        return Promise.resolve({
          data: [
            {
              id: "msg-1",
              chat_id: "quarterly-plan",
              role: "user",
              content: "What changed in the plan?",
              citations: [],
              created_at: "2026-06-25T12:00:00Z",
            },
            {
              id: "msg-2",
              chat_id: "quarterly-plan",
              role: "assistant",
              content: "The plan now prioritizes rollout work in July.",
              citations: [],
              created_at: "2026-06-25T12:01:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat/quarterly-plan" });

    expect(
      await screen.findByText(/what changed in the plan\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the plan now prioritizes rollout work in july/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /review the transcript, follow the retrieved evidence/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("shows a recoverable error state when the corpus readiness check fails", async () => {
    const queryClient = createAppQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    });
    const getSpy = jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.reject(new Error("Corpus check failed."));
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat", queryClient });

    expect(
      await screen.findByRole("heading", {
        name: /we couldn't load the current corpus status/i,
      }),
    ).toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /retry corpus check/i }));

    expect(getSpy).toHaveBeenCalledWith("/documents/");
  });

  it("starts a new chat even when there are no uploaded documents", async () => {
    const user = userEvent.setup();

    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      if (url === "/chats/empty-corpus-chat/messages") {
        return Promise.resolve({
          data: [
            {
              id: "msg-user-1",
              chat_id: "empty-corpus-chat",
              role: "user",
              content: "Can you summarize our company policies?",
              citations: [],
              created_at: "2026-06-25T12:00:00Z",
            },
            {
              id: "msg-assistant-1",
              chat_id: "empty-corpus-chat",
              role: "assistant",
              content: "I do not have enough information from uploaded documents to answer that yet.",
              citations: [],
              created_at: "2026-06-25T12:00:02Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    jest.spyOn(global, "fetch").mockResolvedValue(
      createSseResponse([
        {
          delay: 0,
          value:
            'event: chat_id\ndata: {"chat_id":"empty-corpus-chat"}\n\n' +
            'event: content\ndata: {"text":"I do not have enough information from uploaded documents to answer that yet."}\n\n' +
            'event: citations\ndata: {"citations":[]}\n\n' +
            "event: done\ndata: [DONE]\n\n",
        },
      ]),
    );

    renderWithProviders(<App />, { route: "/chat" });

    const composer = await screen.findByLabelText(/message composer/i);
    await user.type(composer, "Can you summarize our company policies?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(
      await screen.findByText(
        /i do not have enough information from uploaded documents to answer that yet\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/can you summarize our company policies\?/i)).toBeInTheDocument();
  });

  it("shows a recoverable error state when transcript loading fails", async () => {
    const queryClient = createAppQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    });
    const getSpy = jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [
            {
              id: "doc-1",
              filename: "handbook.pdf",
              content_type: "application/pdf",
              size_bytes: 2048,
              status: "completed",
              error_message: null,
              created_at: "2026-06-25T12:00:00Z",
              updated_at: "2026-06-25T12:05:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      if (url === "/chats/broken-chat/messages") {
        return Promise.reject(new Error("Transcript unavailable."));
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat/broken-chat", queryClient });

    expect(
      await screen.findByRole("heading", {
        name: /we couldn't load this conversation/i,
      }),
    ).toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /retry loading transcript/i }));

    expect(getSpy).toHaveBeenCalledWith("/chats/broken-chat/messages");
  });

  it("streams the first reply, disables the composer, and renders citations", async () => {
    const user = userEvent.setup();
    const userMessage = "Summarize the main themes across the uploaded documents.";
    let generatedMessages: MessageResponse[] = [
      {
        id: "msg-user-1",
        chat_id: "generated-chat",
        role: "user",
        content: userMessage,
        citations: [],
        created_at: "2026-06-25T12:00:00Z",
      },
    ];

    const getSpy = jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/documents/") {
        return Promise.resolve({
          data: [
            {
              id: "doc-1",
              filename: "handbook.pdf",
              content_type: "application/pdf",
              size_bytes: 2048,
              status: "completed",
              error_message: null,
              created_at: "2026-06-25T12:00:00Z",
              updated_at: "2026-06-25T12:05:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      if (url === "/chats/generated-chat/messages") {
        return Promise.resolve({
          data: generatedMessages,
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    jest.spyOn(global, "fetch").mockResolvedValue(
      createSseResponse(
        [
          {
            delay: 0,
            value:
              'event: chat_id\ndata: {"chat_id":"generated-chat"}\n\n' +
              'event: content\ndata: {"text":"The handbook says "}\n\n',
          },
          {
            delay: 300,
            value:
              'event: content\ndata: {"text":"rollouts start in July."}\n\n' +
              'event: citations\ndata: {"citations":[{"document_id":"doc-1","source":"handbook.pdf","chunk_id":"chunk-1","page":3,"snippet":"Rollouts begin in July."}]}\n\n' +
              "event: done\ndata: [DONE]\n\n",
          },
        ],
        (chunk) => {
          if (chunk.includes("event: done")) {
            generatedMessages = [
              ...generatedMessages,
              {
                id: "msg-assistant-1",
                chat_id: "generated-chat",
                role: "assistant",
                content: "The handbook says rollouts start in July.",
                citations: [
                  {
                    document_id: "doc-1",
                    source: "handbook.pdf",
                    chunk_id: "chunk-1",
                    page: 3,
                    snippet: "Rollouts begin in July.",
                  },
                ],
                created_at: "2026-06-25T12:01:00Z",
              },
            ];
          }
        },
      ),
    );

    renderWithProviders(<App />, { route: "/chat" });

    await user.type(
      await screen.findByLabelText(/message composer/i),
      userMessage,
    );

    const sendButton = screen.getByRole("button", { name: /send/i });
    await waitFor(() => expect(sendButton).toBeEnabled());
    await user.click(sendButton);

    await waitFor(() =>
      expect(screen.getByLabelText(/message composer/i)).toBeDisabled(),
    );
    expect(await screen.findByText(/the handbook says /i)).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith("/chats/generated-chat/messages");
    expect(screen.getByText(/handbook\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/p\.3/i)).toBeInTheDocument();
  });
});
