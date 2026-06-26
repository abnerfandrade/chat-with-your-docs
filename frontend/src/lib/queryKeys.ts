export const queryKeys = {
  documents: ["documents"] as const,
  chats: ["chats"] as const,
  chatMessages: (chatId: string) => ["chat-messages", chatId] as const,
};
