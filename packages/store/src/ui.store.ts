import Cookies from 'js-cookie';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const isProduction = process.env.NODE_ENV === 'production';

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

export interface ThemeState {
  theme: string;
  setTheme: (value: string) => void;
  _hasHydrated: boolean;
}

export type ThemePersistedState = Pick<ThemeState, 'theme'>;

const cookieThemeStorage = {
  getItem: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = Cookies.get(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    if (typeof document === 'undefined') return;
    Cookies.set(name, value, {
      path: '/',
      expires: 365,
      secure: isProduction,
      sameSite: 'lax',
    });
  },
  removeItem: (name: string) => {
    if (typeof document === 'undefined') return;
    Cookies.remove(name, { path: '/' });
  },
};

export const useThemeCookieStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (value: string) => {
        set({ theme: value });
      },
      _hasHydrated: false,
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => cookieThemeStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

interface UIState {
  isSideBarOpen: boolean;
  setSideBarOpen: (_value: boolean) => void;
  _hasHydrated: boolean;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSideBarOpen: true,
      setSideBarOpen: (value: boolean) => set({ isSideBarOpen: value }),
      _hasHydrated: false,
    }),
    {
      name: 'ui',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        isSideBarOpen: state.isSideBarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
