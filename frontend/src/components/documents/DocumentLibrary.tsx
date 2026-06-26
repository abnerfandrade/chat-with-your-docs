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
      <div
        className="space-y-3 px-[22px] py-[18px]"
        role="status"
        aria-live="polite"
        aria-label="Loading documents"
      >
        <span className="sr-only">Loading documents</span>
        <div className="h-24 rounded-[16px] border border-[var(--line)] bg-[#1a2432] animate-pulse" />
        <div className="h-24 rounded-[16px] border border-[var(--line)] bg-[#1a2432] animate-pulse" />
        <div className="h-24 rounded-[16px] border border-[var(--line)] bg-[#1a2432] animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="px-[22px] py-[18px]">
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
                className="rounded-[12px] border-0 bg-[var(--accent)] px-4 py-[10px] text-[0.84rem] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
      <div className="px-[22px] py-[18px]">
        <StatePanel
          eyebrow="No matches"
          title="No documents match the current filters"
          description="Try a different search or reset the current sort and filter settings."
          actions={
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-[12px] border border-[var(--line)] bg-[#1a2432] px-4 py-[10px] text-[0.84rem] font-semibold text-slate-100 transition hover:bg-[#202c3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Reset filters
            </button>
          }
        />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="px-[22px] py-[18px]">
        <StatePanel
          eyebrow="Library empty"
          title="The library is empty"
          description="Upload a `.txt`, `.md`, or `.pdf` document to start building the shared corpus."
          actions={
            <>
              <button
                type="button"
                onClick={onFocusUpload}
                className="cursor-pointer rounded-[12px] border-0 bg-[var(--accent)] px-4 py-[10px] text-[0.84rem] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Upload documents
              </button>
              <Link
                to="/chat"
                className="rounded-[12px] border border-[var(--line)] bg-[#1a2432] px-4 py-[10px] text-[0.84rem] font-semibold text-slate-100 transition hover:bg-[#202c3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Go to chat
              </Link>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto px-[22px] py-[18px]">
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} />
      ))}
    </div>
  );
}
