import { http, HttpResponse } from "msw";
import {
  chatMessagesFixture,
  chatsFixture,
  documentsFixture,
  scaffoldFixture,
} from "./fixtures";

export const handlers = [
  http.get("http://localhost:8000/health", () =>
    HttpResponse.json(scaffoldFixture),
  ),
  http.get("http://localhost:8000/chats", () =>
    HttpResponse.json(chatsFixture),
  ),
  http.get("http://localhost:8000/documents/", () =>
    HttpResponse.json(documentsFixture),
  ),
  http.get("http://localhost:8000/chats/:chatId/messages", () =>
    HttpResponse.json(chatMessagesFixture),
  ),
];
