"use client";

import { useState, useCallback } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";
import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useUser } from "@clerk/react";
import { m, AnimatePresence } from "motion/react";

export function PublicProfileHeader() {
  const [mobileMenuOpen, setMobileMenuOpenState] = useState(false);
  const { user, isLoaded } = useUser();
  const isLoggedIn = isLoaded && !!user;

  const setMobileMenuOpen = useCallback((next: boolean) => {
    setMobileMenuOpenState(next);
    document.body.style.overflow = next ? "hidden" : "";
  }, []);

  useMountEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  });

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold py-2 shrink-0"
          >
            <Image
              src="/logo.svg"
              alt="Orgnote"
              width={28}
              height={28}
              className="size-7 sm:size-8 shrink-0"
            />
            <span className="text-base sm:text-lg">Orgnote</span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-3">
            <div className="flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
            {!isLoggedIn && (
              <>
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium px-4 text-sm cursor-pointer"
                  >
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="font-medium px-5 text-sm cursor-pointer"
                  >
                    Sign up
                  </Button>
                </SignUpButton>
              </>
            )}
          </nav>

          {/* Mobile menu button — show hamburger if not logged in, theme toggle if logged in */}
          {isLoggedIn ? (
            <div className="md:hidden flex items-center justify-center rounded-md border border-input bg-background p-2">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu overlay - fixed position so it doesn't push content */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop with blur */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 top-14 z-30 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu panel */}
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="md:hidden fixed top-14 left-0 right-0 z-40 bg-background shadow-lg"
            >
              <div className="flex flex-col px-4 py-4">
                {/* Theme toggle row */}
                <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50">
                  <span className="text-sm font-medium">Theme</span>
                  <div className="flex items-center justify-center rounded-md border border-input bg-background p-1.5">
                    <AnimatedThemeToggler aria-label="Toggle theme" />
                  </div>
                </div>

                {/* Auth buttons - only show if not logged in */}
                {!isLoggedIn && (
                  <>
                    <div className="border-t border-border my-2" />
                    <div className="flex flex-col gap-2">
                      <SignInButton mode="modal">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-center font-medium text-sm h-11 cursor-pointer"
                        >
                          Login
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button
                          size="sm"
                          className="font-medium text-sm h-11 cursor-pointer"
                        >
                          Sign up
                        </Button>
                      </SignUpButton>
                    </div>
                  </>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
