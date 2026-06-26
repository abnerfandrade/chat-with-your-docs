import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/api/documents";
import { isDocumentPending } from "@/lib/documents";
import { queryKeys } from "@/lib/queryKeys";

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: listDocuments,
    refetchInterval: (query) => {
      const documents = query.state.data;
      return Array.isArray(documents) &&
        documents.some((document) => isDocumentPending(document.status))
        ? 3000
        : false;
    },
  });
}
