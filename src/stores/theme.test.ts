// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/stores/theme';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light', sidebarCollapsed: false });
  });

  it('has light as default theme', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme updates the theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('setTheme applies data-theme to document', () => {
    useThemeStore.getState().setTheme('midnight');
    expect(document.documentElement.getAttribute('data-theme')).toBe('midnight');
  });

  it('toggleSidebar flips the collapsed state', () => {
    expect(useThemeStore.getState().sidebarCollapsed).toBe(false);
    useThemeStore.getState().toggleSidebar();
    expect(useThemeStore.getState().sidebarCollapsed).toBe(true);
    useThemeStore.getState().toggleSidebar();
    expect(useThemeStore.getState().sidebarCollapsed).toBe(false);
  });

  it('supports all 6 theme values', () => {
    const themes = [
      'light',
      'dark',
      'solarized-light',
      'solarized-dark',
      'midnight',
      'high-contrast',
    ] as const;

    for (const t of themes) {
      useThemeStore.getState().setTheme(t);
      expect(useThemeStore.getState().theme).toBe(t);
    }
  });
});
