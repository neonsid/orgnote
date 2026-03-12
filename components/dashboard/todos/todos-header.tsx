"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { UserInfo } from "../user-info";

export function TodosHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="size-5 text-muted-foreground" />
            <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={24}
                height={24}
                className="size-5"
              />
            </div>
          </Link>
          <span className="text-muted-foreground select-none">/</span>
          <span className="text-sm font-medium text-foreground">
            Daily Activities
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
