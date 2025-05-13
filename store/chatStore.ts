import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CoreMessage } from 'ai'; // Ensure this type is available

export type InteractionMode = "roast" | "positive";

interface ChatState {
  name: string;
  career: string;
  currentResponse: string;
  isLoading: boolean;
  error: string | null;
  history: Array<{
    id: string;
    name: string;
    career: string;
    mode: InteractionMode;
    response: string;
    timestamp: Date;
  }>;
  setName: (name: string) => void;
  setCareer: (career: string) => void;
  fetchAIResponse: (mode: InteractionMode) => Promise<void>;
  clearHistory: () => void;
  clearCurrentResponse: () => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      name: '',
      career: '',
      currentResponse: '',
      isLoading: false,
      error: null,
      history: [],
      setName: (name) => set({ name }),
      setCareer: (career) => set({ career }),
      clearCurrentResponse: () => set({ currentResponse: '', error: null }),
      fetchAIResponse: async (mode: InteractionMode) => {
        const { name, career } = get();
        if (!name.trim() || !career.trim()) {
          set({ error: "Please enter both name and career.", isLoading: false, currentResponse: '' });
          return;
        }

        set({ isLoading: true, error: null, currentResponse: '' });

        try {
          // We are not sending historical chat context for this simple roast/positive feedback app
          // but you could pass a filtered version of `get().history` if needed.
          // For now, an empty array [] for conversationHistory passed to the API.
          const apiHistory: CoreMessage[] = []; // No conversational context needed for this use case

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, career, mode, history: apiHistory }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Error: ${response.statusText}`);
          }

          const data = await response.json();
          const aiText = data.text;

          set((state) => ({
            currentResponse: aiText,
            isLoading: false,
            history: [
              { id: Date.now().toString(), name, career, mode, response: aiText, timestamp: new Date() },
              ...state.history.slice(0, 19), // Keep last 20 history items
            ],
          }));
        } catch (error) {
          console.error("Failed to fetch AI response:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          set({ error: errorMessage, isLoading: false, currentResponse: '' });
        }
      },
      clearHistory: () => set({ history: [], currentResponse: '', error: null }),
    }),
    {
      name: 'roast-positive-chat-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ history: state.history }), // Only persist history
    }
  )
);

export default useChatStore;