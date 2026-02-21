"use client";

import { Fish, Sparkles, BrainCog } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DashboardDemo } from "@/components/dashboard/dashboard-demo";
import { FeaturesSection } from "@/components/features-section";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Hero — centered in viewport */}
        <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 py-14 sm:py-16 md:min-h-[calc(70vh-3.5rem)]">
          <div className="flex flex-col items-center gap-5 sm:gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 p-4 sm:p-5 shadow-sm">
              <Fish
                className="size-10 sm:size-14 text-blue-600 dark:text-blue-400"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Bookmarks for goldfish memory
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-normal max-w-lg mx-auto leading-relaxed">
                Forget where you saved that link? Goldfish remembers for
                you—with instant AI summaries so every bookmark makes sense at a
                glance.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                <Sparkles className="size-3.5 text-amber-500" aria-hidden />
                AI-powered summaries
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                <BrainCog className="size-3.5 text-blue-500" aria-hidden />
                Never lose a link
              </span>
            </div>
          </div>
        </section>

        {/* Live interactive demo */}
        <section className="px-4 sm:px-6 pb-10 sm:pb-14">
          <DashboardDemo />
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 py-10 sm:py-14">
          <FeaturesSection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
