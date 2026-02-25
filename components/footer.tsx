import Link from 'next/link'
import Image from 'next/image'

const FOOTER_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
] as const

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/80 backdrop-blur">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-6">
        {/* Brand */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Image
            src="/logo.svg"
            alt="Orgnote"
            width={20}
            height={20}
            className="size-5 shrink-0 opacity-60"
          />
          <span className="text-sm">© {new Date().getFullYear()} Orgnote</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-4 sm:gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
