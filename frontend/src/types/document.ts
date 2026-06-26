export type DocumentStatus = "queued" | "processing" | "completed" | "failed";

export type DocumentResponse = {
  id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
};

export type UploadResponse = {
  id: string;
  filename: string;
  status: DocumentStatus;
};
