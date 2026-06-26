import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/api/documents";
import { queryKeys } from "@/lib/queryKeys";

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: listDocuments,
  });
}
