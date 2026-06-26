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
        <strong className="block truncate text-[0.92rem] font-semibold text-white">
          {document.filename}
        </strong>
        {document.error_message ? (
          <span className="mt-[6px] block text-[0.82rem] leading-[1.45] text-rose-200">
            Error: {document.error_message}
          </span>
        ) : (
          <span className="mt-[6px] block text-[0.82rem] leading-[1.45] text-[var(--muted)]">
            {document.status === "completed"
              ? "Available across all chats."
              : "Background ingestion is updating this document."}
          </span>
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
        <button
          type="button"
          className="rounded-[12px] border border-[var(--line)] bg-transparent px-3 py-[9px] text-[0.8rem] font-semibold text-[var(--text)] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          View details
        </button>
      </div>
    </article>
  );
}
