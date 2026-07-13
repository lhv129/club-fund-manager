"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface ToggleSwitchProps {
    checked: boolean;
    loading: boolean;
    onChange: () => void;
    disabled?: boolean;
    /** Nhãn a11y tuỳ biến; mặc định dùng common.active / common.inactive theo `checked`. */
    ariaLabel?: string;
}

const ToggleSwitch = ({
    checked,
    loading,
    onChange,
    disabled = false,
    ariaLabel,
}: ToggleSwitchProps) => {
    const t = useTranslations("common");
    const isDisabled = loading || disabled;
    const resolvedAriaLabel = ariaLabel ?? (checked ? t("active") : t("inactive"));

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={resolvedAriaLabel}
            aria-busy={loading}
            onClick={onChange}
            disabled={isDisabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                } ${loading ? "opacity-70 cursor-not-allowed" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            {loading ? (
                <span className="m-auto">
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                </span>
            ) : (
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"
                        }`}
                />
            )}
        </button>
    );
};

export default ToggleSwitch;
