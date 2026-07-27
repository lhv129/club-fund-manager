"use client";

import { AlertCircle, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckBoxProps {
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckBox({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    error,
}: CheckBoxProps) {
    return (
        <div>
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={disabled}
                onClick={onChange}
                className={[
                    "group relative w-full flex items-center gap-3 px-3.5 py-3 rounded-xl",
                    "text-left transition-all duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                    !disabled ? "cursor-pointer" : "",
                    checked
                        ? "bg-primary/8 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/25"
                        : "hover:bg-gray-50 dark:hover:bg-white/5 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-white/10",
                ].join(" ")}
            >
                {/* Square box */}
                <span
                    className={[
                        "relative flex-shrink-0 w-5 h-5 rounded-md border-2",
                        "flex items-center justify-center",
                        "transition-all duration-200 ease-out",
                        error
                            ? checked
                                ? "border-rose-500 bg-rose-500 shadow-sm shadow-rose-500/30"
                                : "border-rose-400 group-hover:border-rose-500"
                            : checked
                                ? "border-primary bg-primary shadow-sm shadow-primary/30"
                                : "border-gray-300 dark:border-gray-600 group-hover:border-primary/60 group-hover:bg-primary/5",
                    ].join(" ")}
                >
                    {/* Checkmark with spring animation */}
                    <Check
                        className={[
                            "w-3.5 h-3.5 text-white",
                            "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                            "origin-center",
                            checked
                                ? "opacity-100 scale-100 rotate-0"
                                : "opacity-0 scale-0 -rotate-45",
                        ].join(" ")}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Ripple effect on check */}
                    <span
                        className={[
                            "absolute inset-0 rounded-md pointer-events-none",
                            "transition-transform duration-500 ease-out origin-center",
                            error ? "bg-rose-500/25" : "bg-primary/25",
                            checked
                                ? "scale-100 opacity-100"
                                : "scale-50 opacity-0",
                        ].join(" ")}
                    />
                </span>

                {/* Label + description */}
                <span className="flex-1 min-w-0">
                    <span
                        className={[
                            "block text-sm font-medium leading-snug transition-colors duration-200",
                            error
                                ? "text-rose-600 dark:text-rose-400"
                                : checked
                                    ? "text-primary"
                                    : "text-gray-800 dark:text-gray-100",
                        ].join(" ")}
                    >
                        {label}
                    </span>
                    {description && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                            {description}
                        </span>
                    )}
                </span>

                {/* Active indicator bar on the right */}
                <span
                    className={[
                        "flex-shrink-0 w-1 h-7 rounded-full transition-all duration-300 ease-out",
                        checked
                            ? error
                                ? "bg-rose-500 opacity-100 scale-y-100"
                                : "bg-primary opacity-100 scale-y-100"
                            : "bg-transparent opacity-0 scale-y-0",
                    ].join(" ")}
                />
            </button>

            {error && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-500 px-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}
