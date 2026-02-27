"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  iconOnly?: boolean;
  triggerRef?: React.RefObject<{ toggle: () => void } | null>;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  iconOnly = false,
  triggerRef,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    const element = iconOnly ? containerRef.current : buttonRef.current;
    if (!element) return;

    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } = element.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [isDark, duration, iconOnly]);

  useEffect(() => {
    if (triggerRef) {
      (triggerRef as React.MutableRefObject<{ toggle: () => void }>).current = {
        toggle: toggleTheme,
      };
    }
  }, [triggerRef, toggleTheme]);

  const icon = isDark ? (
    <Sun className="size-4" />
  ) : (
    <Moon className="size-4" />
  );

  if (iconOnly) {
    return (
      <div
        ref={containerRef}
        className={cn("text-muted-foreground", className)}
      >
        {icon}
      </div>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {icon}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
