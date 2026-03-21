'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { LogInIcon, Menu, UserIcon, X } from 'lucide-react'
import Link from 'next/link'
import { dark } from '@clerk/themes'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const themeToggleRef = useRef<{ toggle: () => void }>(null)

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
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium px-4 text-sm cursor-pointer"
              >
                Login
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" appearance={{ baseTheme: dark }}>
              <Button
                size="sm"
                className="font-medium px-5 text-sm cursor-pointer"
              >
                Sign up
              </Button>
            </SignUpButton>
          </nav>

          {/* Mobile hamburger button — visible only on mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
          <>
            {/* Overlay */}
            <div
              className="md:hidden fixed inset-0 top-14 z-30 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panel */}
            <div className="md:hidden absolute top-14 left-0 right-0 z-40 border-b border-border bg-background shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1.5 p-3">
                <div className="flex items-center justify-between">
                  <button
                    id="theme-changing-button"
                    onClick={() => themeToggleRef.current?.toggle()}
                    className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span>Theme</span>
                    <AnimatedThemeToggler
                      iconOnly
                      triggerRef={themeToggleRef}
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
                    >
                      Login
                      <LogInIcon className="size-4" />
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
                    >
                      Sign up
                      <UserIcon className="size-4" />
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  )
}
