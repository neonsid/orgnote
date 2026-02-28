"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import BrainCog from "lucide-react/dist/esm/icons/brain-cog";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DashboardDemo } from "@/components/landing/dashboard-demo";
import { FeaturesSection } from "@/components/features-section";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const demoVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1] as const,
      delay: 0.3,
    },
  },
};

const featuresVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
      delay: 0.5,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Hero — centered in viewport */}
        <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 py-14 sm:py-16 md:min-h-[calc(70vh-3.5rem)]">
          <motion.div
            className="flex flex-col items-center gap-5 sm:gap-6 max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 p-4 sm:p-5 shadow-sm"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="size-10 sm:size-14"
                  aria-hidden
                />
              </motion.div>
            </motion.div>
            <motion.div
              className="flex flex-col gap-3 sm:gap-4"
              variants={itemVariants}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Bookmarks you'll actually find
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-normal max-w-lg mx-auto leading-relaxed">
                Forget where you saved that link? Orgnote remembers for you—with
                instant AI summaries so every bookmark makes sense at a glance.
              </p>
            </motion.div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:scale-105 hover:-translate-y-0.5 cursor-default">
                <Sparkles className="size-3.5 text-amber-500" aria-hidden />
                AI-powered summaries
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:scale-105 hover:-translate-y-0.5 cursor-default">
                <BrainCog className="size-3.5 text-blue-500" aria-hidden />
                Never lose a link
              </span>
            </div>
          </motion.div>
        </section>

        {/* Live interactive demo */}
        <motion.section
          className="px-4 sm:px-6"
          variants={demoVariants}
          initial="hidden"
          animate="visible"
        >
          <DashboardDemo />
        </motion.section>

        {/* Features */}
        <motion.section
          className="px-4 sm:px-6 py-4 sm:py-14"
          variants={featuresVariants}
          initial="hidden"
          animate="visible"
        >
          <FeaturesSection />
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
