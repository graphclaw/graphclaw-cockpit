// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme =
  | 'light'
  | 'dark'
  | 'solarized-light'
  | 'solarized-dark'
  | 'midnight'
  | 'high-contrast';

export interface ThemeDefinition {
  id: Theme;
  name: string;
  swatch: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'light', name: 'Light', swatch: '#F8FAFC' },
  { id: 'dark', name: 'Dark', swatch: '#0F172A' },
  { id: 'solarized-light', name: 'Solarized Light', swatch: '#FDF6E3' },
  { id: 'solarized-dark', name: 'Solarized Dark', swatch: '#002B36' },
  { id: 'midnight', name: 'Midnight Blue', swatch: '#0A0F1E' },
  { id: 'high-contrast', name: 'High Contrast', swatch: '#FFFFFF' },
];

interface ThemeState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

function applyThemeToDOM(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'gc-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDOM(state.theme);
      },
    },
  ),
);

// Apply theme to DOM on store changes
useThemeStore.subscribe((state) => {
  applyThemeToDOM(state.theme);
});
