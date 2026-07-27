// @/components/shared/ui/ToggleForm.tsx
"use client";

import { AlertCircle } from "lucide-react";

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
    return (
        <div>
            <div
                className={`
                    flex items-center justify-between gap-4
                    py-2.5 transition-colors duration-150
                    ${error
                        ? "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-500/10"
                        : "border-border bg-background"
                    }
                `}
            >
                {/* Label + description */}
                <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                        {label}
                    </span>
                    {description && (
                        <span className="block text-xs text-foreground-muted mt-0.5 leading-snug">
                            {description}
                        </span>
                    )}
                </span>

                {/* Pill toggle */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={onChange}
                    className={`
                        relative inline-flex h-6 w-11 flex-shrink-0
                        rounded-full border-2 border-transparent
                        transition-colors duration-200 ease-in-out
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-primary/40 focus-visible:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${!disabled ? "cursor-pointer" : ""}
                        ${checked
                            ? error ? "bg-rose-500" : "bg-primary"
                            : "bg-background-muted"
                        }
                    `}
                >
                    <span
                        className={`
                            pointer-events-none inline-block h-5 w-5
                            rounded-full bg-white shadow-md
                            transition-transform duration-200 ease-in-out
                            ${checked ? "translate-x-5" : "translate-x-0"}
                        `}
                    />
                </button>
            </div>

            {error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}