"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { SignupDialog } from "@/components/signup-dialog";
import Link from "next/link";

export function Header() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold py-2"
          >
            <Image
              src="/logo.svg"
              alt="Orgnote"
              width={32}
              height={32}
              className="size-8 shrink-0"
            />
            <span className="text-lg">Orgnote</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
            <Button
              variant="ghost"
              size="default"
              onClick={() => setLoginOpen(true)}
              className="font-medium px-3 sm:px-4"
            >
              Login
            </Button>
            <Button
              size="default"
              onClick={() => setSignupOpen(true)}
              className="font-medium px-4 sm:px-5"
            >
              Sign up
            </Button>
          </nav>
        </div>
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
