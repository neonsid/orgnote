"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
    {
        question: "What is Orgnote?",
        answer:
            "Orgnote is an AI-powered bookmark manager designed for people who save links but forget why. It automatically generates summaries for every bookmark so you can recall the context at a glance.",
    },
    {
        question: "How does the AI summary work?",
        answer:
            "When you save a link, Orgnote fetches the page content and uses a large language model to produce a concise, human-readable summary. The summary is stored alongside the bookmark so you never have to re-visit a page just to remember what it was about.",
    },
    {
        question: "Is Orgnote free to use?",
        answer:
            "Orgnote offers a generous free tier that covers most personal use. We also offer premium plans with additional features like unlimited bookmarks, advanced search, and team collaboration.",
    },
    {
        question: "Can I import bookmarks from my browser?",
        answer:
            "Yes! Orgnote supports one-click import from Chrome, Firefox, Safari, and Edge. You can also import from Pocket, Raindrop, and other bookmark managers.",
    },
    {
        question: "Is my data private and secure?",
        answer:
            "Absolutely. Your bookmarks are encrypted at rest and in transit. We never sell your data or use it for advertising. See our Privacy Policy for full details.",
    },
    {
        question: "Can I use Orgnote on mobile?",
        answer:
            "Yes. Orgnote is fully responsive and works great on phones and tablets. We also offer a share-sheet integration on iOS and Android so you can save links from any app.",
    },
    {
        question: "How do I delete my account?",
        answer:
            "You can delete your account at any time from the Settings page. All your data will be permanently removed within 30 days of the request.",
    },
];

function FAQItem({
    question,
    answer,
}: {
    question: string;
    answer: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-border rounded-xl overflow-hidden transition-colors hover:border-foreground/20">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm sm:text-base font-medium text-foreground transition-colors hover:bg-accent/50"
            >
                {question}
                <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default function FAQPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-14 sm:py-20">
                <div className="w-full max-w-2xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col gap-3 text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-muted-foreground text-base sm:text-lg">
                            Everything you need to know about Orgnote.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {FAQ_ITEMS.map((item) => (
                            <FAQItem
                                key={item.question}
                                question={item.question}
                                answer={item.answer}
                            />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
