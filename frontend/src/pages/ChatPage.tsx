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
  const {
    data: documentsData,
    error: documentsError,
    isError: isDocumentsError,
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useDocuments();
  const {
    data: messagesData,
    error: messagesError,
    isError: isMessagesError,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
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
        description={hasPersistedChat ? undefined : "Open a fresh thread grounded in your uploaded corpus."}
        eyebrow={hasPersistedChat ? "Chat transcript" : "New chat"}
      />

      <div className="min-h-0">
        {shouldShowTranscript ? (
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
            isError={isMessagesError}
            errorMessage={
              messagesError instanceof Error ? messagesError.message : undefined
            }
            onRetry={chatId ? () => void refetchMessages() : undefined}
            streamingMessage={streamingMessage}
          />
        ) : (
          <ChatEmptyState
            hasCompletedDocuments={hasCompletedDocuments}
            isCheckingDocuments={isLoadingDocuments}
            isDocumentsError={isDocumentsError}
            documentsErrorMessage={
              documentsError instanceof Error ? documentsError.message : undefined
            }
            onSelectPrompt={handleSelectPrompt}
            onRetryDocuments={() => void refetchDocuments()}
          />
        )}
      </div>

      <div className="sticky bottom-0">
        {error ? (
          <div className="border-t border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 lg:px-8" role="alert">
            <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void (chatId ? refetchMessages() : refetchDocuments())}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Refresh state
              </button>
            </div>
          </div>
        ) : null}
        <ChatComposer
          isInputEnabled={hasCompletedDocuments}
          isStreaming={isStreaming}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
