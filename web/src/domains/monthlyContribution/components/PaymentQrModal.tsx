"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import CustomImage from "@/components/shared/media/CustomImage";

interface PaymentQrModalProps {
    qrUrl: string | null;
    alt: string;
    closeLabel: string;
    onClose: () => void;
}

export function PaymentQrModal({
    qrUrl,
    alt,
    closeLabel,
    onClose,
}: PaymentQrModalProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!qrUrl) return;

        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement as HTMLElement | null;

        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [onClose, qrUrl]);

    if (!qrUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
                aria-label={closeLabel}
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-white p-3 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label={closeLabel}
                    title={closeLabel}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-black/65 text-white shadow-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
                    <CustomImage
                        src={qrUrl}
                        alt={alt}
                        className="h-full w-full object-contain"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </div>
        </div>
    );
}
