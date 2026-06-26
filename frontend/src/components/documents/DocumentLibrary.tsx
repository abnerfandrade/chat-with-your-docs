import { Link } from "react-router-dom";
import type { DocumentResponse } from "@/types/document";
import { DocumentRow } from "./DocumentRow";

type DocumentLibraryProps = {
  documents: DocumentResponse[];
  hasDocuments: boolean;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onFocusUpload: () => void;
};

export function DocumentLibrary({
  documents,
  hasDocuments,
  isLoading,
  hasActiveFilters,
  onResetFilters,
  onFocusUpload,
}: DocumentLibraryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
        <div className="h-24 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] animate-pulse" />
      </div>
    );
  }

  if (documents.length === 0 && hasDocuments && hasActiveFilters) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/8 bg-[var(--panel-soft)] px-6 py-8 text-center">
        <h3 className="text-xl font-semibold text-white">No matches found</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Try a different search or reset the current sort and filter settings.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Reset filters
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/8 bg-[var(--panel-soft)] px-6 py-8 text-center">
        <h3 className="text-xl font-semibold text-white">
          The library is empty
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Upload a `.txt`, `.md`, or `.pdf` document to start building the shared corpus.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onFocusUpload}
            className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b]"
          >
            Upload documents
          </button>
          <Link
            to="/chat"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Go to chat
          </Link>
        </div>
      </div>
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
