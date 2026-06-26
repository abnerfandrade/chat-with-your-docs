import { useRef } from "react";
import { MAX_UPLOAD_SIZE_MB } from "@/lib/documents";

type UploadDropzoneProps = {
  isUploading: boolean;
  pendingUploads: string[];
  validationError: string | null;
  onFilesSelected: (files: FileList | null) => void;
};

export function UploadDropzone({
  isUploading,
  pendingUploads,
  validationError,
  onFilesSelected,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function focusInput() {
    inputRef.current?.click();
  }

  return (
    <section
      aria-labelledby="upload-dropzone-heading"
      className="rounded-[28px] border border-dashed border-white/10 bg-[var(--panel-soft)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            id="upload-dropzone-heading"
            className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500"
          >
            Upload source documents
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            Add files to the shared corpus
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            Supported file types: `.txt`, `.md`, and `.pdf`. Individual files
            can be up to {MAX_UPLOAD_SIZE_MB}MB and start processing immediately
            after upload.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={focusInput}
            className="rounded-2xl border border-white/10 bg-[#223246] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#29405b]"
          >
            Choose files
          </button>
          <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Multiple files supported
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        id="document-upload-input"
        type="file"
        aria-label="Document upload input"
        accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
        multiple
        className="sr-only"
        onChange={(event) => onFilesSelected(event.target.files)}
      />

      {validationError ? (
        <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {validationError}
        </p>
      ) : null}

      {isUploading ? (
        <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Uploading {pendingUploads.join(", ")}…
        </div>
      ) : null}
    </section>
  );
}
