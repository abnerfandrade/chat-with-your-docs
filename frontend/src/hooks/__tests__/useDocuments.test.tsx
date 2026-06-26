import type { ReactNode } from "react";
import { jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/api/axios";
import { useDocuments } from "@/hooks/useDocuments";
import { createAppQueryClient } from "@/lib/queryClient";

describe("useDocuments", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches the document list with the shared query key", async () => {
    const getSpy = jest
      .spyOn(apiClient, "get")
      .mockResolvedValue([
        {
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
        },
      ][0] as Awaited<ReturnType<typeof apiClient.get>>);

    const queryClient = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDocuments(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith("/documents/");
    expect(result.current.data?.[0]?.filename).toBe("handbook.pdf");
  });
});
