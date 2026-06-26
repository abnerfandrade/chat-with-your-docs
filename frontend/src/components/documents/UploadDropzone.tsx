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
  const describedBy = [
    "upload-dropzone-copy",
    validationError ? "document-upload-error" : null,
    isUploading ? "document-upload-progress" : null,
  ]
    .filter(Boolean)
    .join(" ");

  function focusInput() {
    inputRef.current?.click();
  }

  return (
    <section
      aria-labelledby="upload-dropzone-heading"
      className="rounded-[18px] border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] px-5 py-5"
    >
      <div className="flex flex-col gap-[18px] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            id="upload-dropzone-heading"
            className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#8ba2c6]"
          >
            Upload source documents
          </p>
          <h2 className="mt-3 text-[0.94rem] font-semibold text-white">
            Add files to the shared corpus
          </h2>
          <p className="mt-[6px] max-w-[42rem] text-[0.84rem] leading-7 text-[var(--muted)]">
          <span id="upload-dropzone-copy">
            Supported file types: `.txt`, `.md`, and `.pdf`. Individual files
            can be up to {MAX_UPLOAD_SIZE_MB}MB and start processing immediately
            after upload.
          </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={focusInput}
            className="rounded-[12px] border-0 bg-[var(--accent)] px-[14px] py-[10px] text-[0.84rem] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Choose files
          </button>
          <span className="rounded-[12px] border border-[var(--line-strong)] bg-[#1a2432] px-[14px] py-[10px] text-[0.84rem] text-[var(--text)]">
            Multiple files supported
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        id="document-upload-input"
        type="file"
        aria-label="Document upload input"
        aria-describedby={describedBy}
        aria-invalid={validationError ? "true" : "false"}
        accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
        multiple
        className="sr-only"
        onChange={(event) => onFilesSelected(event.target.files)}
      />

      {validationError ? (
        <p
          id="document-upload-error"
          role="alert"
          className="mt-4 rounded-[14px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-[0.84rem] text-rose-100"
        >
          {validationError}
        </p>
      ) : null}

      {isUploading ? (
        <div
          id="document-upload-progress"
          role="status"
          aria-live="polite"
          className="mt-4 rounded-[14px] border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-[0.84rem] text-sky-100"
        >
          Uploading {pendingUploads.join(", ")}…
        </div>
      ) : null}
    </section>
  );
}
