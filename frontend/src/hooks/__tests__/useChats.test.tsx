import type { ReactNode } from "react";
import { jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/api/axios";
import { useChats } from "@/hooks/useChats";
import { createAppQueryClient } from "@/lib/queryClient";

describe("useChats", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches chats for sidebar history state", async () => {
    const getSpy = jest.spyOn(apiClient, "get").mockResolvedValue({
      data: [
        {
          id: "chat-1",
          title: "Quarterly plan",
          created_at: "2026-06-25T12:00:00Z",
        },
      ],
    } as Awaited<ReturnType<typeof apiClient.get>>);

    const queryClient = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledWith("/chats");
    expect(result.current.data?.[0]?.title).toBe("Quarterly plan");
  });
});
