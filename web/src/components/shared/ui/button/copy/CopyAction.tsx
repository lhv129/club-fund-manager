"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

interface CopyActionProps {
    value: string;
    className?: string;
}

export function CopyAction({ value, className }: CopyActionProps) {
    const t = useTranslations("common");
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1600);
        } catch {
            // Clipboard is unavailable on insecure origins or when permission is denied.
        }
    };

    const label = copied ? t("copied") : t("copy");

    return (
        <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label={label}
            title={label}
            className={cn(
                "relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                "text-foreground-muted transition-[color,background-color,transform] duration-200",
                "hover:bg-foreground/[0.06] hover:text-foreground active:scale-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                copied && "text-emerald-600 hover:text-emerald-600",
                className,
            )}
        >
            <Copy
                className={cn(
                    "absolute h-3.5 w-3.5 transition-[opacity,transform] duration-200",
                    copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
                )}
            />
            <Check
                className={cn(
                    "absolute h-3.5 w-3.5 transition-[opacity,transform] duration-200",
                    copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
                )}
            />
            <span className="sr-only" aria-live="polite">
                {copied ? label : ""}
            </span>
        </button>
    );
}
