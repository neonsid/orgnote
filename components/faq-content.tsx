"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
    question: string;
    answer: string;
}

export function FAQItem({ question, answer }: FAQItemProps) {
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
