export type MessageRole = "user" | "assistant";

export type CitationResponse = {
  document_id: string;
  source: string;
  chunk_id: string;
  page: number | null;
  snippet: string;
};

export type MessageResponse = {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  citations: CitationResponse[];
  created_at: string;
};

export type ChatResponse = {
  id: string;
  title: string;
  created_at: string;
};

export type ChatStreamInput = {
  message: string;
  chat_id: string | null;
};

export type ChatStreamEvent =
  | {
      event: "chat_id";
      data: { chat_id: string };
    }
  | {
      event: "content";
      data: { text: string };
    }
  | {
      event: "citations";
      data: { citations: CitationResponse[] };
    }
  | {
      event: "done";
      data: "[DONE]";
    }
  | {
      event: "error";
      data: { error: string };
    };
