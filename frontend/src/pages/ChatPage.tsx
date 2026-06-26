import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatStream } from "@/hooks/useChatStream";
import { useDocuments } from "@/hooks/useDocuments";
import { useChatDraftStore } from "@/stores/useChatDraftStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

export function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { data: documentsData, isLoading: isLoadingDocuments } = useDocuments();
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
  } = useChatMessages(chatId);
  const setDraft = useChatDraftStore((state) => state.setDraft);
  const clearDraft = useChatDraftStore((state) => state.clearDraft);
  const pushNotification = useNotificationStore((state) => state.pushNotification);
  const documents = Array.isArray(documentsData) ? documentsData : [];
  const messages = Array.isArray(messagesData) ? messagesData : [];
  const hasCompletedDocuments = documents.some(
    (document) => document.status === "completed",
  );
  const hasPersistedChat = Boolean(chatId);
  const { error, isStreaming, sendMessage, streamingMessage } = useChatStream({
    chatId,
    onChatCreated: (nextChatId) => {
      navigate(`/chat/${nextChatId}`, { replace: true });
    },
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    pushNotification({
      tone: "error",
      title: "Streaming interrupted",
      description: error,
    });
  }, [error, pushNotification]);

  function handleSelectPrompt(prompt: string) {
    setDraft(prompt);
  }

  async function handleSubmit(message: string) {
    if (!message.trim()) {
      return;
    }

    clearDraft();
    await sendMessage(message);
  }

  const shouldShowTranscript =
    hasPersistedChat || isStreaming || messages.length > 0 || Boolean(streamingMessage);

  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] grid-rows-[auto_1fr_auto]">
      <ChatHeader
        title={hasPersistedChat ? "Conversation" : "Start a new conversation"}
        description={
          hasPersistedChat
            ? "Review the transcript, follow the retrieved evidence, and continue the conversation."
            : "Open a fresh thread grounded in your uploaded corpus."
        }
        eyebrow={hasPersistedChat ? "Chat transcript" : "New chat"}
      />

      <div className="min-h-0">
        {shouldShowTranscript ? (
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
            streamingMessage={streamingMessage}
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
        <ChatComposer
          isInputEnabled={hasCompletedDocuments}
          isStreaming={isStreaming}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
