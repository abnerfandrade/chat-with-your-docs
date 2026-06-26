import App from "@/App";
import { renderWithProviders, screen } from "../../tests/setup/test-utils";

describe("App scaffold", () => {
  it("renders the scaffold landing screen", () => {
    renderWithProviders(<App />);

    expect(
      screen.getByRole("heading", {
        name: /the frontend foundation is wired and ready for the real app shell/i,
      }),
    ).toBeInTheDocument();
  });

  it("redirects unknown routes back to the scaffold root", () => {
    renderWithProviders(<App />, { route: "/missing-route" });

    expect(screen.getByText(/F01 Frontend scaffold/i)).toBeInTheDocument();
  });
});
