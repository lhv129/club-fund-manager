"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/utils";

interface ToggleFormProps {
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
}

export default function ToggleForm({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    error,
}: ToggleFormProps) {
    const hasError = Boolean(error);

    return (
        <div className="w-full">
            {/* Main row */}
            <div
                className={cn(
                    "flex w-full items-start justify-between gap-4",
                    "py-2.5",
                    "transition-colors duration-150",
                )}
            >
                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div
                        className={cn(
                            "text-sm font-medium leading-5",
                            "text-foreground",
                            disabled &&
                            "text-foreground-muted",
                        )}
                    >
                        {label}
                    </div>

                    {description && (
                        <p
                            className={cn(
                                "mt-0.5 max-w-2xl",
                                "text-xs leading-relaxed",
                                "text-foreground-muted",
                                disabled &&
                                "opacity-70",
                            )}
                        >
                            {description}
                        </p>
                    )}
                </div>

                {/* Toggle */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                    disabled={disabled}
                    onClick={onChange}
                    className={cn(
                        "relative mt-0.5 inline-flex",
                        "h-6 w-11 shrink-0",
                        "items-center rounded-full",
                        "border-2 border-transparent",
                        "transition-all duration-200 ease-out",
                        "focus-visible:outline-none",
                        "focus-visible:ring-2",
                        "focus-visible:ring-primary/40",
                        "focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed",
                        "disabled:opacity-50",
                        !disabled &&
                        "cursor-pointer",
                        !disabled &&
                        "active:scale-[0.97]",

                        checked
                            ? hasError
                                ? "bg-rose-500"
                                : "bg-primary"
                            : "bg-background-muted",

                        !disabled &&
                        !checked &&
                        "hover:bg-background-muted/80",

                        !disabled &&
                        checked &&
                        !hasError &&
                        "hover:bg-primary/90",

                        !disabled &&
                        checked &&
                        hasError &&
                        "hover:bg-rose-600",
                    )}
                >
                    {/* Thumb */}
                    <span
                        aria-hidden="true"
                        className={cn(
                            "pointer-events-none",
                            "block h-5 w-5 rounded-full",
                            "bg-white shadow-sm",
                            "ring-1 ring-black/5",
                            "transition-transform duration-200",
                            "ease-out",
                            checked
                                ? "translate-x-5"
                                : "translate-x-0",
                        )}
                    />
                </button>
            </div>

            {/* Error */}
            {hasError && (
                <div
                    role="alert"
                    className="
                        flex
                        items-start
                        gap-1.5
                        pb-2.5
                        text-xs
                        leading-relaxed
                        text-rose-500
                    "
                >
                    <AlertCircle
                        aria-hidden="true"
                        className="
                            mt-0.5
                            h-3.5
                            w-3.5
                            shrink-0
                        "
                    />

                    <span className="min-w-0">
                        {error}
                    </span>
                </div>
            )}
        </div>
    );
}