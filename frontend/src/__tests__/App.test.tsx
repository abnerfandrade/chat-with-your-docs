import App from "@/App";
import { renderWithProviders, screen } from "../../tests/setup/test-utils";

describe("App routing", () => {
  it("redirects the root route to chat", () => {
    renderWithProviders(<App />);

    expect(
      screen.getByRole("heading", {
        name: /start a new conversation/i,
      }),
    ).toBeInTheDocument();
  });

  it("redirects unknown routes back to the scaffold root", () => {
    renderWithProviders(<App />, { route: "/missing-route" });

    expect(
      screen.getByRole("heading", { name: /start a new conversation/i }),
    ).toBeInTheDocument();
  });

  it("renders the selected chat route", () => {
    renderWithProviders(<App />, { route: "/chat/quarterly-plan" });

    expect(
      screen.getByText(/chat id: quarterly-plan/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /this route is ready for historical messages and streaming state in the next step/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the documents route", () => {
    renderWithProviders(<App />, { route: "/documents" });

    expect(
      screen.getByRole("heading", { name: /documents library/i }),
    ).toBeInTheDocument();
  });
});
