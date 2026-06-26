import { jest } from "@jest/globals";
import App from "@/App";
import { apiClient } from "@/api/axios";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { renderWithProviders, screen } from "../../../tests/setup/test-utils";

describe("ChatPage", () => {
  beforeEach(() => {
    useChatDraftStore.setState({ draft: "" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the documents CTA when no completed documents are available", async () => {
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
      await screen.findByText(/upload documents before starting the first chat/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open documents/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/message composer/i)).toBeDisabled();
  });

  it("shows starter prompts when completed documents exist", async () => {
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
      await screen.findByRole("button", {
        name: /summarize the main themes across the uploaded documents/i,
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
      screen.getByText(/historical messages appear in the transcript below/i),
    ).toBeInTheDocument();
  });
});
