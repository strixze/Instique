import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      tabIndex={0}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className="group relative flex items-center justify-between h-8 px-2 rounded-full border border-slate-200/80 dark:border-[#262A2E] bg-slate-100/90 dark:bg-[#101315] hover:bg-slate-200/70 dark:hover:bg-[#181D20] active:bg-slate-200 dark:active:bg-[#15191C] active:scale-[0.98] transition-all duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]/60"
    >
      {/* Sun Icon (Left) */}
      <span
        onClick={(e) => {
          e.stopPropagation();
          if (isDark) toggleTheme();
        }}
        className={`flex items-center justify-center transition-colors duration-200 ${
          !isDark
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-slate-400 dark:text-[#707980]'
        }`}
        title="Light Mode"
      >
        <Sun size={15} strokeWidth={2} />
      </span>

      {/* Sliding Toggle Track + Knob (Center) */}
      <div
        className={`relative inline-flex items-center h-5 w-9 mx-1.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          isDark
            ? 'bg-[#34D399]'
            : 'bg-amber-500'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
            isDark ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>

      {/* Moon Icon (Right) */}
      <span
        onClick={(e) => {
          e.stopPropagation();
          if (!isDark) toggleTheme();
        }}
        className={`flex items-center justify-center transition-colors duration-200 ${
          isDark
            ? 'text-[#34D399]'
            : 'text-slate-400 dark:text-[#707980]'
        }`}
        title="Dark Mode"
      >
        <Moon size={15} strokeWidth={2} />
      </span>
    </button>
  );
}

