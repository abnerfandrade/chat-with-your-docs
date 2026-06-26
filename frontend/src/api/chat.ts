import { apiClient } from "./axios";
import type { ChatResponse, MessageResponse } from "@/types/chat";

export async function listChats() {
  const response = await apiClient.get<ChatResponse[]>("/chats");
  return response.data;
}

export async function listMessages(chatId: string) {
  const response = await apiClient.get<MessageResponse[]>(
    `/chats/${chatId}/messages`,
  );
  return response.data;
}
