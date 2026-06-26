import type { DocumentResponse, DocumentStatus } from "@/types/document";

export const SUPPORTED_DOCUMENT_EXTENSIONS = [".txt", ".md", ".pdf"] as const;
export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDocumentTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Pending update";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function getDocumentFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export function validateDocumentFile(file: File) {
  const extension = getDocumentFileExtension(file.name);
  if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension as (typeof SUPPORTED_DOCUMENT_EXTENSIONS)[number])) {
    return `Unsupported file type for '${file.name}'. Use .txt, .md, or .pdf.`;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File '${file.name}' exceeds the ${MAX_UPLOAD_SIZE_MB}MB upload limit.`;
  }

  return null;
}

export function isDocumentPending(status: DocumentStatus) {
  return status === "queued" || status === "processing";
}

export function sortDocuments(
  documents: DocumentResponse[],
  sortBy: "newest" | "oldest" | "filename" | "status",
) {
  const items = [...documents];

  if (sortBy === "filename") {
    return items.sort((left, right) => left.filename.localeCompare(right.filename));
  }

  if (sortBy === "status") {
    return items.sort((left, right) => left.status.localeCompare(right.status));
  }

  return items.sort((left, right) => {
    const leftValue = new Date(left.created_at).getTime();
    const rightValue = new Date(right.created_at).getTime();

    return sortBy === "oldest" ? leftValue - rightValue : rightValue - leftValue;
  });
}
