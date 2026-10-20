"use client";

import { AlertCircle, Check, Loader2, Share2 } from "lucide-react";
import { useActionStatus } from "@/components/shared/ui/button/copy/useActionStatus";

export interface ShareActionLabels {
    idle: string;
    done: string;
    error: string;
}

interface ShareActionProps {
    title: string;
    text: string;
    labels: ShareActionLabels;
    getUrl?: () => string | undefined;
    className?: string;
}

/** Generic native-share button with a clipboard fallback. */
export function ShareAction({
    title,
    text,
    labels,
    getUrl,
    className,
}: ShareActionProps) {
    const { status, setStatus } = useActionStatus();

    const handleShare = async () => {
        setStatus("busy");
        const url = getUrl?.();

        if (typeof navigator.share === "function") {
            try {
                const shareData: ShareData = { title, text };
                if (url) shareData.url = url;
                await navigator.share(shareData);
                setStatus("done");
                return;
            } catch (error) {
                if ((error as DOMException)?.name === "AbortError") {
                    setStatus("idle");
                    return;
                }
            }
        }

        try {
            await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
            setStatus("done");
        } catch {
            setStatus("error");
        }
    };

    const label = status === "done"
        ? labels.done
        : status === "error"
            ? labels.error
            : labels.idle;

    return (
        <button
            type="button"
            onClick={() => void handleShare()}
            disabled={status === "busy"}
            className={className ?? "inline-flex min-h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-[transform,opacity,box-shadow] duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"}
        >
            {status === "busy" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "done" ? (
                <Check className="h-4 w-4" />
            ) : status === "error" ? (
                <AlertCircle className="h-4 w-4" />
            ) : (
                <Share2 className="h-4 w-4" />
            )}
            <span aria-live="polite">{label}</span>
        </button>
    );
}
