import { http, HttpResponse } from "msw";
import { scaffoldFixture } from "./fixtures";

export const handlers = [
  http.get("http://localhost:8000/health", () =>
    HttpResponse.json(scaffoldFixture),
  ),
];
