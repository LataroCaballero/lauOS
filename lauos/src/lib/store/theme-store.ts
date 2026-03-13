import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccentColor = 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'orange'

interface ThemeState {
  isDark: boolean
  accent: AccentColor
  toggleDark: () => void
  setAccent: (color: AccentColor) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      accent: 'yellow',
      toggleDark: () => set((s) => ({ isDark: !s.isDark })),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: 'lauos-theme',
      partialize: (state) => ({ isDark: state.isDark, accent: state.accent }),
    }
  )
)
