import { jest } from "@jest/globals";
import { apiClient } from "@/api/axios";
import { listDocuments, uploadDocument } from "@/api/documents";
import type { DocumentResponse, UploadResponse } from "@/types/document";

describe("documents api", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists documents from the backend contract", async () => {
    const payload: DocumentResponse[] = [
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
    ];

    const getSpy = jest.spyOn(apiClient, "get").mockResolvedValue({
      data: payload,
    });

    await expect(listDocuments()).resolves.toEqual(payload);
    expect(getSpy).toHaveBeenCalledWith("/documents/");
  });

  it("uploads a file as multipart form data", async () => {
    const payload: UploadResponse = {
      id: "doc-2",
      filename: "notes.txt",
      status: "queued",
    };
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const postSpy = jest.spyOn(apiClient, "post").mockResolvedValue({
      data: payload,
    });

    await expect(uploadDocument(file)).resolves.toEqual(payload);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      "/documents/upload",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const [, body] = postSpy.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);
  });
});
