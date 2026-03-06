'use client'
import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Terms of Service', href: '/terms', external: false as const },
  { label: 'Privacy Policy', href: '/privacy', external: false as const },
  {
    label: 'GitHub',
    href: 'https://github.com/neonsid/orgnote',
    external: true as const,
  },
] as const

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/80 backdrop-blur">
      <div className="px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Links row */}
          <nav className="flex items-center gap-6 sm:gap-10">
            {FOOTER_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Copyright tagline */}
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Orgnote – Save and organize your
            bookmarks beautifully
          </p>
        </div>
      </div>
    </footer>
  )
}
