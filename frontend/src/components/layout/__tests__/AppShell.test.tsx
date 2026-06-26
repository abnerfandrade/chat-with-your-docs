import { jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { apiClient } from "@/api/axios";
import { createAppQueryClient } from "@/lib/queryClient";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { renderWithProviders, screen } from "../../../../tests/setup/test-utils";

describe("AppShell layout", () => {
  beforeEach(() => {
    useChatDraftStore.setState({ draft: "" });
    useSidebarStore.setState({ isMobileSidebarOpen: false });
    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/chats") {
        return Promise.resolve({
          data: [
            {
              id: "onboarding-brief",
              title: "Onboarding brief",
              created_at: "2026-06-24T10:00:00Z",
            },
            {
              id: "quarterly-plan",
              title: "Quarterly plan",
              created_at: "2026-06-23T10:00:00Z",
            },
            {
              id: "support-playbook",
              title: "Support playbook",
              created_at: "2026-06-22T10:00:00Z",
            },
          ],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      if (url === "/documents/" || String(url).startsWith("/chats/")) {
        return Promise.resolve({
          data: [],
        } as Awaited<ReturnType<typeof apiClient.get>>);
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders navigation and recent chats in the sidebar", async () => {
    renderWithProviders(<App />, { route: "/chat" });

    expect(
      screen.getByRole("navigation", { name: /primary navigation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent chats/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chats/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /documents/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/onboarding brief/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/quarterly plan/i),
    ).toBeInTheDocument();
  });

  it("highlights the active route", () => {
    renderWithProviders(<App />, { route: "/documents" });

    expect(screen.getByRole("link", { name: /documents/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens and closes the mobile drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/chat" });

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(
      screen.getByRole("dialog", { name: /navigation menu/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^close$/i }));

    expect(
      screen.queryByRole("dialog", { name: /navigation menu/i }),
    ).not.toBeInTheDocument();
  });

  it("clears the draft when starting a new chat from an existing conversation", async () => {
    const user = userEvent.setup();
    useChatDraftStore.setState({ draft: "Carry over this draft" });

    renderWithProviders(<App />, { route: "/chat/onboarding-brief" });

    await user.click(screen.getByRole("button", { name: /new chat/i }));

    expect(useChatDraftStore.getState().draft).toBe("");
    expect(
      screen.getByText(/ask grounded questions against the shared document corpus/i),
    ).toBeInTheDocument();
  });

  it("routes into an existing chat from sidebar history", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: "/documents" });

    await user.click(
      await screen.findByRole("link", {
        name: /quarterly plan/i,
      }),
    );

    expect(
      screen.getByRole("heading", { name: /^chat$/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/conversation history will appear here/i),
    ).toBeInTheDocument();
  });

  it("shows a retry state when sidebar history fails to load", async () => {
    const queryClient = createAppQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    });
    jest.restoreAllMocks();
    jest.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/chats") {
        return Promise.reject(new Error("History unavailable."));
      }

      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    });

    renderWithProviders(<App />, { route: "/chat", queryClient });

    expect(
      await screen.findByRole("heading", {
        name: /we couldn't load chat history/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry history/i }),
    ).toBeInTheDocument();
  });
});
