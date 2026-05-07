import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

interface ConfigState {
  clientId: string | null;
  ensureClientId: () => string;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      clientId: null,

      ensureClientId: () => {
        let id = get().clientId;

        if (!id) {
          id = crypto.randomUUID();
          set({ clientId: id });
        }

        if (typeof window !== 'undefined') {
          document.cookie = `x-client-id=${id}; path=/; max-age=31536000; SameSite=Lax`;
        }

        return id;
      },
    }),
    {
      name: 'app-config',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
