import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { renderWithProviders, screen } from "../../../../tests/setup/test-utils";

describe("AppShell layout", () => {
  beforeEach(() => {
    useChatDraftStore.setState({ draft: "" });
    useSidebarStore.setState({ isMobileSidebarOpen: false });
  });

  it("renders navigation and recent chats in the sidebar", () => {
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
      screen.getByText(/open a fresh thread grounded in your uploaded corpus/i),
    ).toBeInTheDocument();
  });
});
