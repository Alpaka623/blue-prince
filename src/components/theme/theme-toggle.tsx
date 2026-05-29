"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <div className="h-14 rounded-lg border border-border bg-muted/30" />
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="group h-14 w-full justify-between overflow-hidden px-4"
      onClick={() => setTheme(isLight ? "dark" : "light")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-accent">
          <Sun
            className={cn(
              "absolute size-5 text-primary transition-all duration-300",
              isLight
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-50 opacity-0"
            )}
          />
          <Moon
            className={cn(
              "absolute size-5 text-primary transition-all duration-300",
              isLight
                ? "rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            )}
          />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-sm font-medium">
            {isLight ? "Light Mode" : "Dark Mode"}
          </span>
          <span className="block text-xs text-muted-foreground">
            {isLight ? "Helle Darstellung aktiv" : "Dunkle Darstellung aktiv"}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "relative h-6 w-12 rounded-full bg-muted transition-colors",
          isLight && "bg-primary/25"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-primary transition-all duration-300",
            isLight ? "left-7" : "left-1"
          )}
        />
      </span>
    </Button>
  );
}
