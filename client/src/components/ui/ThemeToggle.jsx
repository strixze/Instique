import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-1.5 rounded-lg transition-colors duration-150 ${
        isDark
          ? 'text-amber-400 hover:bg-dark-hover'
          : 'text-secondary hover:text-deep hover:bg-surface'
      }`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={17} strokeWidth={1.8} />
      ) : (
        <Moon size={17} strokeWidth={1.8} />
      )}
    </button>
  );
}
