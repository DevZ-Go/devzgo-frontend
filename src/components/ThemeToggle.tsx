import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  variant?: "ghost" | "editorial" | "pill";
  className?: string;
}

export function ThemeToggle({
  variant = "editorial",
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 cursor-pointer select-none ${
        variant === "editorial"
          ? isDark
            ? "bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 backdrop-blur-md shadow-sm"
            : "bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 border border-stone-300/80 backdrop-blur-md shadow-sm"
          : variant === "pill"
          ? "px-3 py-1.5 gap-2 rounded-full bg-cream-200/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold"
          : "text-gray-500 dark:text-stone-300 hover:text-gray-800 dark:hover:text-white hover:bg-cream-200/60 dark:hover:bg-stone-800/60"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-1.5"
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(252,237,150,0.6)]" />
            {variant === "pill" && <span className="text-xs">Light</span>}
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-indigo-500 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
            {variant === "pill" && <span className="text-xs">Dark</span>}
          </>
        )}
      </motion.div>
    </motion.button>
  );
}
