import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface ChatMessage {
  sender: "user" | "ai"
  text: string
  isError?: boolean
  isTypingComplete?: boolean
}

interface ChatState {
  chatMessages: ChatMessage[]
  isChatOpen: boolean
  isMascotDismissed: boolean
  addMessage: (msg: ChatMessage) => void
  clearChat: (welcomeText: string) => void
  setChatOpen: (isOpen: boolean) => void
  setMascotDismissed: (isDismissed: boolean) => void
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatMessages: [],
      isChatOpen: false,
      isMascotDismissed: false,
      addMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
      clearChat: (welcomeText) => set({ chatMessages: [{ sender: "ai", text: welcomeText }] }),
      setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
      setMascotDismissed: (isDismissed) => set({ isMascotDismissed: isDismissed }),
      setChatMessages: (messages) => set((state) => ({
        chatMessages: typeof messages === "function" ? messages(state.chatMessages) : messages
      })),
    }),
    {
      name: "vicky-chat-store-v2",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
