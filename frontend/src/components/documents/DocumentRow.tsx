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
  return (
    <article className="rounded-[24px] border border-white/6 bg-[var(--panel-soft)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {document.filename}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
            <span>{formatFileSize(document.size_bytes)}</span>
            <span aria-hidden="true">•</span>
            <span>{document.content_type ?? "Unknown type"}</span>
            <span aria-hidden="true">•</span>
            <span>
              Updated {formatDocumentTimestamp(document.updated_at ?? document.created_at)}
            </span>
          </div>
          {document.error_message ? (
            <p className="mt-3 text-sm leading-6 text-rose-200">
              Error: {document.error_message}
            </p>
          ) : null}
        </div>
        <StatusBadge status={document.status} />
      </div>
    </article>
  );
}
