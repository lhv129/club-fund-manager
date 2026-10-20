"use client";

import { AlertCircle, Check, FileDown, Loader2 } from "lucide-react";
import { captureElementPng } from "@/components/shared/ui/button/dowloadImage/captureElementPng";
import type { ElementRef } from "@/components/shared/ui/button/dowloadImage/captureElementPng";
import { useActionStatus } from "@/components/shared/ui/button/copy/useActionStatus";

interface PdfDownloadActionProps {
    elementRef: ElementRef;
    fileName: string;
    label: string;
    title: string;
    failureLabel: string;
    className?: string;
}

export function PdfDownloadAction({
    elementRef,
    fileName,
    label,
    title,
    failureLabel,
    className,
}: PdfDownloadActionProps) {
    const { status, setStatus } = useActionStatus();

    const handleDownload = async () => {
        setStatus("busy");

        try {
            const { dataUrl, width, height } = await captureElementPng(elementRef);
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({
                unit: "px",
                format: [width, height],
                orientation: height >= width ? "portrait" : "landscape",
                hotfixes: ["px_scaling"],
            });
            pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
            pdf.save(fileName);
            setStatus("done");
        } catch (error) {
            console.error("[PdfDownloadAction] export failed", error);
            setStatus("error");
        }
    };

    const displayedLabel = status === "error" ? failureLabel : label;

    return (
        <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={status === "busy"}
            className={className ?? "inline-flex min-h-9 items-center gap-2 px-3.5 text-sm font-medium text-foreground-muted transition-[color,background-color] duration-200 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50"}
            title={title}
        >
            {status === "busy" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "done" ? (
                <Check className="h-4 w-4 text-emerald-600" />
            ) : status === "error" ? (
                <AlertCircle className="h-4 w-4 text-rose-600" />
            ) : (
                <FileDown className="h-4 w-4" />
            )}
            <span aria-live="polite">{displayedLabel}</span>
        </button>
    );
}
