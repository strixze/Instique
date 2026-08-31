import { create } from 'zustand';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('instique-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  // Add brief transition class for smooth theme switch
  root.classList.add('theme-transition');
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('instique-theme', theme);
  // Remove transition class after animation completes
  setTimeout(() => root.classList.remove('theme-transition'), 250);
}

export const useThemeStore = create((set) => {
  // Apply initial theme on store creation
  const initial = getInitialTheme();
  // Ensure DOM reflects the initial state (in case inline script didn't run)
  if (typeof window !== 'undefined') {
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        return { theme: next };
      }),
    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },
  };
});
