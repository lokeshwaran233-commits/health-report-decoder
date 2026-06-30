import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  const handleClick = (e: React.MouseEvent) => {
    // Stop the navbar drawer's outside-click handler from intercepting on mobile.
    e.stopPropagation();
    // Flip the class synchronously so mobile devices repaint without waiting on React.
    if (typeof document !== "undefined") {
      const next = isDark ? "light" : "dark";
      const root = document.documentElement;
      if (next === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      root.style.colorScheme = next;
    }
    toggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-pill border border-brand-border text-brand-dark hover:bg-brand-surface transition-colors ${className ?? ""}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
