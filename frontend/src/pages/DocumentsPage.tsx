import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { uploadDocument } from "@/api/documents";
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";
import { DocumentStats } from "@/components/documents/DocumentStats";
import { DocumentToolbar } from "@/components/documents/DocumentToolbar";
import { UploadDropzone } from "@/components/documents/UploadDropzone";
import {
  sortDocuments,
  validateDocumentFile,
} from "@/lib/documents";
import { queryKeys } from "@/lib/queryKeys";
import { useDocuments } from "@/hooks/useDocuments";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { DocumentResponse, DocumentStatus } from "@/types/document";

function getUploadErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "detail" in error.response.data &&
    typeof error.response.data.detail === "string"
  ) {
    return error.response.data.detail;
  }

  if (error instanceof AxiosError && error.message) {
    return error.message;
  }

  return "The upload failed. Please try again.";
}

export function DocumentsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<
    "newest" | "oldest" | "filename" | "status"
  >("newest");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);
  const { data: documentsData, isLoading } = useDocuments();
  const documents = Array.isArray(documentsData) ? documentsData : [];
  const queryClient = useQueryClient();
  const pushNotification = useNotificationStore((state) => state.pushNotification);
  const previousStatusesRef = useRef<Map<string, DocumentStatus>>(new Map());

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (response) => {
      pushNotification({
        tone: "success",
        title: `Upload queued: ${response.filename}`,
        description:
          "The document was accepted and is being processed in the background.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    },
    onError: (error, file) => {
      pushNotification({
        tone: "error",
        title: `Upload failed: ${file.name}`,
        description: getUploadErrorMessage(error),
      });
    },
  });

  useEffect(() => {
    if (documents.length === 0) {
      previousStatusesRef.current = new Map();
      return;
    }

    const nextStatuses = new Map<string, DocumentStatus>();

    documents.forEach((document) => {
      nextStatuses.set(document.id, document.status);
      const previousStatus = previousStatusesRef.current.get(document.id);

      if (!previousStatus || previousStatus === document.status) {
        return;
      }

      if (
        (previousStatus === "queued" || previousStatus === "processing") &&
        document.status === "completed"
      ) {
        pushNotification({
          tone: "success",
          title: `Ready for chat: ${document.filename}`,
          description:
            "Processing finished and the document is now available for retrieval.",
        });
      }

      if (
        (previousStatus === "queued" || previousStatus === "processing") &&
        document.status === "failed"
      ) {
        pushNotification({
          tone: "error",
          title: `Processing failed: ${document.filename}`,
          description:
            document.error_message ??
            "The ingestion pipeline could not finish for this document.",
        });
      }
    });

    previousStatusesRef.current = nextStatuses;
  }, [documents, pushNotification]);

  const visibleDocuments = useMemo(() => {
    const filtered = documents.filter((document) =>
      document.filename.toLowerCase().includes(searchValue.toLowerCase().trim()),
    );

    return sortDocuments(filtered, sortValue);
  }, [documents, searchValue, sortValue]);

  async function handleFilesSelected(files: FileList | null) {
    setValidationError(null);

    if (!files || files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(files);
    const firstValidationError = selectedFiles
      .map(validateDocumentFile)
      .find((error) => error !== null);

    if (firstValidationError) {
      setValidationError(firstValidationError);
      pushNotification({
        tone: "error",
        title: "Upload blocked",
        description: firstValidationError,
      });
      return;
    }

    setPendingUploads(selectedFiles.map((file) => file.name));

    try {
      for (const file of selectedFiles) {
        try {
          await uploadMutation.mutateAsync(file);
        } catch {
          // Notifications surface upload failures; the page should keep running.
        }
      }
    } finally {
      setPendingUploads([]);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setSortValue("newest");
  }

  function focusUploadInput() {
    const input = document.getElementById("document-upload-input");
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] grid-rows-[auto_auto_auto_1fr]">
      <header className="border-b border-white/6 px-6 py-5 lg:px-8">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
          Documents library
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Build and monitor the shared corpus
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Upload source files, track ingestion progress, and keep the retrieval
          library ready for grounded chats.
        </p>
      </header>

      <div className="px-6 py-5 lg:px-8">
        <DocumentStats documents={documents} />
      </div>

      <div className="px-6 pb-5 lg:px-8">
        <UploadDropzone
          isUploading={uploadMutation.isPending}
          pendingUploads={pendingUploads}
          validationError={validationError}
          onFilesSelected={handleFilesSelected}
        />
      </div>

      <div className="px-6 pb-5 lg:px-8">
        <DocumentToolbar
          resultCount={visibleDocuments.length}
          searchValue={searchValue}
          sortValue={sortValue}
          onSearchChange={setSearchValue}
          onSortChange={setSortValue}
        />
      </div>

      <div className="px-6 pb-8 lg:px-8">
        <DocumentLibrary
          documents={visibleDocuments}
          hasDocuments={documents.length > 0}
          isLoading={isLoading}
          hasActiveFilters={searchValue.trim().length > 0 || sortValue !== "newest"}
          onResetFilters={resetFilters}
          onFocusUpload={focusUploadInput}
        />
      </div>
    </section>
  );
}
