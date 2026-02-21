import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const SECTIONS = [
    {
        title: "1. Acceptance of Terms",
        content:
            "By accessing or using Orgnote, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.",
    },
    {
        title: "2. Description of Service",
        content:
            "Orgnote is an AI-powered bookmark manager that helps you save, organise, and recall web links with automatically generated summaries. The service is provided \"as is\" and we reserve the right to modify or discontinue any feature at any time.",
    },
    {
        title: "3. User Accounts",
        content:
            "You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must be at least 13 years of age to create an account.",
    },
    {
        title: "4. Acceptable Use",
        content:
            "You agree not to use Orgnote for any unlawful purpose, to transmit harmful content, to attempt to gain unauthorised access to our systems, or to interfere with the service's operation. We reserve the right to suspend or terminate accounts that violate these terms.",
    },
    {
        title: "5. Intellectual Property",
        content:
            "The Orgnote service, including its design, code, and branding, is owned by Orgnote and protected by intellectual property laws. Your bookmarks and personal data remain your property. By using the service, you grant us a limited licence to process your content solely for the purpose of providing the service.",
    },
    {
        title: "6. AI-Generated Content",
        content:
            "Summaries and other AI-generated content are provided for convenience and may not always be accurate. You should not rely on AI summaries as a sole source of truth. We are not liable for any decisions made based on AI-generated content.",
    },
    {
        title: "7. Limitation of Liability",
        content:
            "To the fullest extent permitted by law, Orgnote shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.",
    },
    {
        title: "8. Termination",
        content:
            "We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately.",
    },
    {
        title: "9. Changes to Terms",
        content:
            "We reserve the right to modify these terms at any time. We will provide notice of significant changes through the service or via email. Continued use of the service after changes constitutes acceptance of the new terms.",
    },
    {
        title: "10. Governing Law",
        content:
            "These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Orgnote operates, without regard to conflict of law principles.",
    },
    {
        title: "11. Contact",
        content:
            "If you have any questions about these Terms of Service, please contact us at legal@orgnote.app.",
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-14 sm:py-20">
                <div className="w-full max-w-2xl flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col gap-3 text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                            Terms of Service
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
    );
}
