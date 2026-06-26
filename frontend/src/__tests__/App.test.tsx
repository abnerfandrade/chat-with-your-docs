import App from "@/App";
import { renderWithProviders, screen } from "../../tests/setup/test-utils";

describe("App routing", () => {
  it("redirects the root route to chat", () => {
    renderWithProviders(<App />);

    expect(
      screen.getByText(/open a fresh thread grounded in your uploaded corpus/i),
    ).toBeInTheDocument();
  });

  it("redirects unknown routes back to the scaffold root", () => {
    renderWithProviders(<App />, { route: "/missing-route" });

    expect(
      screen.getByText(/open a fresh thread grounded in your uploaded corpus/i),
    ).toBeInTheDocument();
  });

  it("renders the selected chat route", async () => {
    renderWithProviders(<App />, { route: "/chat/quarterly-plan" });

    expect(
      screen.getByRole("heading", { name: /conversation/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /conversation history will appear here/i,
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
