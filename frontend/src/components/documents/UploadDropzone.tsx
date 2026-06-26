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
    <section aria-labelledby="upload-dropzone-heading">
      <div className="flex flex-col gap-[18px] rounded-[18px] border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-5 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <strong id="upload-dropzone-heading" className="block text-[0.94rem]">
            Drop files here or select documents to upload
          </strong>
          <span
            id="upload-dropzone-copy"
            className="mt-[6px] block text-[0.84rem] leading-[1.5] text-[var(--muted)]"
          >
            Supported: .txt, .md, and .pdf up to {MAX_UPLOAD_SIZE_MB}MB. Use
            notifications for upload progress and processing feedback.
          </span>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button
            type="button"
            onClick={focusInput}
            className="cursor-pointer rounded-[12px] border-0 bg-[#7cc7c0] px-[14px] py-[10px] font-semibold text-[#10202a] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Upload document
          </button>
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
