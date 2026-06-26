import { create } from "zustand";

type ChatDraftState = {
  draft: string;
  setDraft: (draft: string) => void;
  clearDraft: () => void;
};

export const useChatDraftStore = create<ChatDraftState>((set) => ({
  draft: "",
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: "" }),
}));
