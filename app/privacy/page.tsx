import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | Orgnote',
  description:
    'Learn how Orgnote collects, uses, and protects your personal data. We never sell your information or use it for advertising.',
}

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly to us, such as your name, email address, and bookmarks you save. We also collect usage data like pages visited, features used, and device information to improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'We use the information we collect to provide, maintain, and improve Orgnote, to generate AI-powered summaries for your bookmarks, and to communicate with you about updates and new features. We do not use your data for advertising purposes.',
  },
  {
    title: '3. Data Sharing',
    content:
      'We do not sell, rent, or share your personal information with third parties for their marketing purposes. We may share anonymised, aggregated data for analytics. We may also disclose information when required by law or to protect our rights.',
  },
  {
    title: '4. Data Security',
    content:
      'We implement industry-standard security measures to protect your data. All data is encrypted in transit (TLS) and at rest. We conduct regular security audits and follow best practices for data protection.',
  },
  {
    title: '5. Data Retention',
    content:
      'We retain your data for as long as your account is active. When you delete your account, all personal data is permanently removed within 30 days. Aggregated, non-identifiable data may be retained for analytical purposes.',
  },
  {
    title: '6. Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data at any time. You can export your bookmarks in standard formats. If you are in the EU, you have additional rights under GDPR, including the right to data portability and the right to object to processing.',
  },
  {
    title: '7. Cookies',
    content:
      'We use essential cookies to keep you signed in and to remember your preferences. We do not use tracking or advertising cookies. You can disable cookies in your browser settings, though some features may not work correctly.',
  },
  {
    title: '8. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting a notice on our website or sending you an email. Your continued use of Orgnote after the changes take effect constitutes acceptance of the new policy.',
  },
  {
    title: '9. Contact Us',
    content:
      'If you have any questions about this Privacy Policy, please contact us at privacy@orgnote.app.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-14 sm:py-20">
        <div className="w-full max-w-2xl flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm">
              Last updated: February 22, 2026
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-2.5">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
