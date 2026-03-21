"use client";

import { motion } from "motion/react";
import { Sparkles, FolderOpen, Share2, Zap } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Stop Forgetting Links",
    icon: Zap,
    description:
      "Save any URL in seconds. No friction, no extra steps. Your bookmarks sync instantly across all your devices.",
  },
  {
    id: 2,
    title: "AI That Actually Gets It",
    icon: Sparkles,
    description:
      "Auto-generated descriptions for every link. Know what a page is about without opening it. Even works with Twitter/X and GitHub.",
  },
  {
    id: 3,
    title: "Find Anything Instantly",
    icon: FolderOpen,
    description:
      "Color-coded groups and powerful search. No more digging through endless folders. Mark read items to keep track of what matters.",
  },
  {
    id: 4,
    title: "Share Your Knowledge",
    icon: Share2,
    description:
      "Create a public profile with your best finds. Let others discover what you read. Export anytime—your data belongs to you.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function FeaturesSection() {
  return (
    <section className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      <motion.div
        className="text-center mb-10 sm:mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          The bookmark manager that actually works
        </h2>
        <p className="text-muted-foreground">
          No more lost links. No more messy folders.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-foreground/20 hover:shadow-md"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative">
              {/* Header: Icon and Number aligned */}
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex rounded-lg bg-muted p-2.5 transition-colors duration-300 group-hover:bg-primary/10">
                  <feature.icon
                    className="size-5 text-foreground/80 transition-colors duration-300 group-hover:text-primary"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-4xl font-bold text-foreground/5 transition-colors duration-300 group-hover:text-primary/10">
                  0{feature.id}
                </span>
              </div>

              {/* Content */}
              <h3 className="mb-1.5 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
