import { apiClient } from "./axios";
import type { DocumentResponse, UploadResponse } from "@/types/document";

export async function listDocuments() {
  const response = await apiClient.get<DocumentResponse[]>("/documents/");
  return response.data;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}
