import type { ReactElement, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createAppQueryClient } from "@/lib/queryClient";

type ProviderOptions = Omit<RenderOptions, "wrapper"> & {
  route?: string;
  queryClient?: ReturnType<typeof createAppQueryClient>;
};

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions = {},
) {
  const {
    route = "/",
    queryClient = createAppQueryClient(),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { screen };
