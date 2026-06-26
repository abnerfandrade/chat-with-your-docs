import { useQuery } from "@tanstack/react-query";
import { listMessages } from "@/api/chat";
import { queryKeys } from "@/lib/queryKeys";

export function useChatMessages(chatId: string | undefined) {
  return useQuery({
    queryKey: chatId ? queryKeys.chatMessages(chatId) : ["chat-messages", null],
    queryFn: () => listMessages(chatId!),
    enabled: Boolean(chatId),
  });
}
