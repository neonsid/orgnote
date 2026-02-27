'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  Sparkles,
  FolderOpen,
  Search,
  Keyboard,
  Fingerprint,
  LayoutList,
} from 'lucide-react'

const features = [
  {
    icon: Bookmark,
    className: 'fill-black dark:fill-white',
    title: 'Save in seconds',
    description: 'Paste any URL, hit enter. Done. No friction, no extra steps.',
  },
  {
    icon: Sparkles,
    title: 'Auto-fetch metadata',
    description:
      'Titles, descriptions, and favicons are pulled automatically. Your links look great without any effort.',
  },
  {
    icon: FolderOpen,
    title: 'Organize with groups',
    description:
      'Create collections to categorize your bookmarks. Keep work, personal, and inspiration separate.',
  },
  {
    icon: Search,
    title: 'Instant search',
    description:
      'Find any bookmark by title, URL, or group. Results appear as you type.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard shortcuts',
    description:
      'Navigate, search, and manage everything without touching your mouse. Built for speed.',
  },
  {
    icon: Fingerprint,
    title: 'Private by default',
    description: 'Your bookmarks are yours alone. No ads, no data selling.',
  },
  {
    icon: LayoutList,
    title: 'Minimal interface',
    description:
      'No clutter, no distractions. Just your bookmarks in a clean, focused layout.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

export function FeaturesSection() {
  return (
    <section className="w-full max-w-2xl mx-auto">
      <motion.div
        className="space-y-4 sm:space-y-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="flex items-start gap-4 sm:gap-5 py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/30"
          >
            <motion.div
              className="shrink-0 mt-0.5"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <feature.icon
                className={cn(
                  'size-5 sm:size-6 text-foreground/70',
                  feature.className
                )}
                strokeWidth={1.5}
              />
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
