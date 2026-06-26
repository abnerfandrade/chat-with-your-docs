import type { DocumentResponse } from "@/types/document";
import {
  formatDocumentTimestamp,
  formatFileSize,
} from "@/lib/documents";
import { StatusBadge } from "./StatusBadge";

type DocumentRowProps = {
  document: DocumentResponse;
};

export function DocumentRow({ document }: DocumentRowProps) {
  const extensionLabel =
    document.filename.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <article className="grid gap-4 rounded-[16px] border border-[var(--line)] bg-[#1a2432] px-[18px] py-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-[0.92rem] font-semibold text-white">
          {document.filename}
        </h3>
        {document.error_message ? (
          <p className="mt-[6px] text-[0.82rem] leading-6 text-rose-200">
            Error: {document.error_message}
          </p>
        ) : (
          <p className="mt-[6px] text-[0.82rem] leading-6 text-[var(--muted)]">
            {document.status === "completed"
              ? "Available across all chats."
              : "Background ingestion is updating this document."}
          </p>
        )}
        <div className="mt-[10px] flex flex-wrap gap-4 text-[0.78rem] text-[var(--muted)]">
          <span>{formatFileSize(document.size_bytes)}</span>
          <span>
            Updated {formatDocumentTimestamp(document.updated_at ?? document.created_at)}
          </span>
          <span>{document.status === "completed" ? "Indexed" : "Pending"}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-[10px] lg:justify-end">
        <span className="rounded-full bg-[var(--panel-soft)] px-[9px] py-[7px] text-[0.72rem] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">
          {extensionLabel}
        </span>
        <StatusBadge status={document.status} />
      </div>
    </article>
  );
}
