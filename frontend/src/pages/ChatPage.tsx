import { useParams } from "react-router-dom";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useDocuments } from "@/hooks/useDocuments";
import { useChatDraftStore } from "@/stores/useChatDraftStore";

export function ChatPage() {
  const { chatId } = useParams();
  const { data: documentsData, isLoading: isLoadingDocuments } = useDocuments();
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
  } = useChatMessages(chatId);
  const setDraft = useChatDraftStore((state) => state.setDraft);
  const documents = Array.isArray(documentsData) ? documentsData : [];
  const messages = Array.isArray(messagesData) ? messagesData : [];
  const hasCompletedDocuments = documents.some(
    (document) => document.status === "completed",
  );
  const hasPersistedChat = Boolean(chatId);

  function handleSelectPrompt(prompt: string) {
    setDraft(prompt);
  }

  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] grid-rows-[auto_1fr_auto]">
      <ChatHeader
        title={hasPersistedChat ? "Conversation" : "Start a new conversation"}
        description={
          hasPersistedChat
            ? "Historical messages appear in the transcript below. Streaming and citations arrive in the next steps."
            : "Open a fresh thread grounded in your uploaded corpus."
        }
        eyebrow={hasPersistedChat ? "Chat transcript" : "New chat"}
      />

      <div className="min-h-0 overflow-y-auto">
        {hasPersistedChat ? (
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
          />
        ) : (
          <ChatEmptyState
            hasCompletedDocuments={hasCompletedDocuments}
            isCheckingDocuments={isLoadingDocuments}
            onSelectPrompt={handleSelectPrompt}
          />
        )}
      </div>

      <div className="sticky bottom-0">
        <ChatComposer isInputEnabled={hasCompletedDocuments} />
      </div>
    </section>
  );
}
