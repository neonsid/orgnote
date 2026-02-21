"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { SignupDialog } from "@/components/signup-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function Header() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="font-medium px-4 text-sm"
            >
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => setSignupOpen(true)}
              className="font-medium px-5 text-sm"
            >
              Sign up
            </Button>
          </nav>

          {/* Mobile hamburger button — visible only on mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Theme
                </span>
                <div className="flex items-center justify-center rounded-md border border-input bg-background p-1.5 hover:bg-accent hover:text-accent-foreground">
                  <AnimatedThemeToggler aria-label="Toggle theme" />
                </div>
              </div>
              <div className="border-t border-border my-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoginOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="justify-start font-medium text-sm h-10"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSignupOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="font-medium text-sm h-10"
              >
                Sign up
              </Button>
            </div>
          </div>
        )}
      </header>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSignupClick={() => setSignupOpen(true)}
      />
      <SignupDialog
        open={signupOpen}
        onOpenChange={setSignupOpen}
        onLoginClick={() => setLoginOpen(true)}
      />
    </>
  );
}
