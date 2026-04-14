import type { Metadata } from 'next'
import { HomePage } from '@/components/landing/home-page'

export const metadata: Metadata = {
  title: "Orgnote — Bookmarks you'll actually find",
  description:
    'AI-powered bookmark manager — save links and get instant summaries so every bookmark makes sense at a glance.',
  openGraph: {
    title: "Orgnote — Bookmarks you'll actually find",
    description:
      'AI-powered bookmark manager — save links and get instant summaries so every bookmark makes sense at a glance.',
  },
}

export default function Home() {
  return <HomePage />
}
