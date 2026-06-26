import { Link } from "react-router-dom";
import type { DocumentResponse } from "@/types/document";
import { StatePanel } from "@/components/layout/StatePanel";
import { DocumentRow } from "./DocumentRow";

type DocumentLibraryProps = {
  documents: DocumentResponse[];
  hasDocuments: boolean;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onFocusUpload: () => void;
  onRetry?: () => void;
};

export function DocumentLibrary({
  documents,
  hasDocuments,
  isLoading,
  isError = false,
  errorMessage,
  hasActiveFilters,
  onResetFilters,
  onFocusUpload,
  onRetry,
}: DocumentLibraryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading documents">
        <span className="sr-only">Loading documents</span>
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert">
        <StatePanel
          eyebrow="Library unavailable"
          title="We couldn't load the document library"
          description={
            errorMessage ??
            "The document list request failed. Retry to recover the shared corpus view."
          }
          tone="error"
          align="left"
          actions={
            onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Retry loading library
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (documents.length === 0 && hasDocuments && hasActiveFilters) {
    return (
      <StatePanel
        eyebrow="No matches"
        title="No documents match the current filters"
        description="Try a different search or reset the current sort and filter settings."
        actions={
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Reset filters
          </button>
        }
      />
    );
  }

  if (documents.length === 0) {
    return (
      <StatePanel
        eyebrow="Library empty"
        title="The library is empty"
        description="Upload a `.txt`, `.md`, or `.pdf` document to start building the shared corpus."
        actions={
          <>
            <button
              type="button"
              onClick={onFocusUpload}
              className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Upload documents
            </button>
            <Link
              to="/chat"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Go to chat
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} />
      ))}
    </div>
  );
}
