import { jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import App from "@/App";
import { apiClient } from "@/api/axios";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { renderWithProviders, screen } from "../../../tests/setup/test-utils";

function createAxiosGetMock(documents: unknown[] | (() => unknown[]) = []) {
  return jest.spyOn(apiClient, "get").mockImplementation((url) => {
    const resolvedDocuments =
      typeof documents === "function" ? documents() : documents;

    if (url === "/chats") {
      return Promise.resolve({
        data: [],
      } as Awaited<ReturnType<typeof apiClient.get>>);
    }

    if (url === "/documents/") {
      return Promise.resolve({
        data: resolvedDocuments,
      } as Awaited<ReturnType<typeof apiClient.get>>);
    }

    return Promise.resolve({
      data: [],
    } as Awaited<ReturnType<typeof apiClient.get>>);
  });
}

describe("DocumentsPage", () => {
  beforeEach(() => {
    act(() => {
      useNotificationStore.getState().clearNotifications();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => {
      useNotificationStore.getState().clearNotifications();
    });
  });

  it("renders toolbar controls and empty-state recovery actions", async () => {
    createAxiosGetMock();

    renderWithProviders(<App />, { route: "/documents" });

    expect(
      await screen.findByRole("searchbox", { name: /search/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /sort by/i })).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /upload documents/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to chat/i })).toBeInTheDocument();
  });

  it("blocks unsupported uploads before submitting the request", async () => {
    const user = userEvent.setup({ applyAccept: false });
    createAxiosGetMock();
    const postSpy = jest.spyOn(apiClient, "post");

    renderWithProviders(<App />, { route: "/documents" });

    await user.upload(
      await screen.findByLabelText(/document upload input/i),
      new File(["a,b,c"], "report.csv", { type: "text/csv" }),
    );

    expect(
      await screen.findAllByText(/unsupported file type for 'report\.csv'/i),
    ).toHaveLength(2);
    expect(postSpy).not.toHaveBeenCalled();
    expect(
      screen.getByText(/upload blocked/i),
    ).toBeInTheDocument();
  });

  it("shows a success notification after a valid upload", async () => {
    const user = userEvent.setup();
    let documents = [] as unknown[];
    createAxiosGetMock(() => documents);
    jest.spyOn(apiClient, "post").mockImplementation(async () => {
      documents = [
        {
          id: "doc-1",
          filename: "handbook.pdf",
          content_type: "application/pdf",
          size_bytes: 2048,
          status: "queued",
          error_message: null,
          created_at: "2026-06-25T12:00:00Z",
          updated_at: "2026-06-25T12:01:00Z",
        },
      ];

      return {
        data: {
          id: "doc-1",
          filename: "handbook.pdf",
          status: "queued",
        },
      } as Awaited<ReturnType<typeof apiClient.post>>;
    });

    renderWithProviders(<App />, { route: "/documents" });

    await user.upload(
      await screen.findByLabelText(/document upload input/i),
      new File(["pdf-content"], "handbook.pdf", {
        type: "application/pdf",
      }),
    );

    expect(
      await screen.findByText(/upload queued: handbook\.pdf/i),
    ).toBeInTheDocument();
  });

  it("shows a failure notification when the upload request fails", async () => {
    const user = userEvent.setup();
    createAxiosGetMock();
    jest.spyOn(apiClient, "post").mockRejectedValue({
      response: {
        data: {
          detail: "A document with the same content was already uploaded.",
        },
      },
    });

    renderWithProviders(<App />, { route: "/documents" });

    await user.upload(
      await screen.findByLabelText(/document upload input/i),
      new File(["duplicate"], "duplicate.md", {
        type: "text/markdown",
      }),
    );

    expect(
      await screen.findByText(/upload failed: duplicate\.md/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/same content was already uploaded/i),
    ).toBeInTheDocument();
  });

  it("filters the document library from the toolbar search field", async () => {
    const user = userEvent.setup();
    createAxiosGetMock([
      {
        id: "doc-1",
        filename: "employee-handbook.pdf",
        content_type: "application/pdf",
        size_bytes: 2048,
        status: "completed",
        error_message: null,
        created_at: "2026-06-25T12:00:00Z",
        updated_at: "2026-06-25T12:02:00Z",
      },
      {
        id: "doc-2",
        filename: "support-playbook.md",
        content_type: "text/markdown",
        size_bytes: 1024,
        status: "failed",
        error_message: "Extractor timeout",
        created_at: "2026-06-24T12:00:00Z",
        updated_at: "2026-06-24T12:10:00Z",
      },
    ]);

    renderWithProviders(<App />, { route: "/documents" });

    expect(
      await screen.findByText(/employee-handbook\.pdf/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/support-playbook\.md/i)).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: /search/i }),
      "playbook",
    );

    expect(screen.queryByText(/employee-handbook\.pdf/i)).not.toBeInTheDocument();
    expect(screen.getByText(/support-playbook\.md/i)).toBeInTheDocument();
  });
});
