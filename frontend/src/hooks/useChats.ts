import { useQuery } from "@tanstack/react-query";
import { listChats } from "@/api/chat";
import { queryKeys } from "@/lib/queryKeys";

export function useChats() {
  return useQuery({
    queryKey: queryKeys.chats,
    queryFn: listChats,
  });
}
