"use client";

import React, { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function DeleteConfirmModal({
    isOpen,
    title,
    description,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    loading = false,
}: DeleteConfirmModalProps) {
    const t = useTranslations("common");
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    const resolvedTitle = title ?? t("deleteConfirmTitle");
    const resolvedDescription = description ?? t("deleteConfirmDesc");
    const resolvedMessage = message ?? t("deleteConfirmMessage");
    const resolvedConfirmText = confirmText ?? t("delete");
    const resolvedCancelText = cancelText ?? t("cancel");

    // Đóng bằng ESC (bỏ qua khi đang loading để không hủy giữa lúc submit).
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onCancel();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, loading, onCancel]);

    // Focus vào nút xác nhận khi mở, tránh phải Tab nhiều lần trước khi bấm Enter.
    useEffect(() => {
        if (isOpen) confirmBtnRef.current?.focus();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
                onClick={loading ? undefined : onCancel}
            />

            <div
                className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                    border border-gray-200 dark:border-gray-800 p-6
                    animate-in fade-in zoom-in-95 duration-150"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center
                        justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>

                    <div className="min-w-0">
                        <h3 id="delete-confirm-title" className="font-semibold text-gray-900 dark:text-white">
                            {resolvedTitle}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {resolvedDescription}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label={resolvedCancelText}
                        className="ml-auto shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-sm mb-5 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {resolvedMessage}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 text-sm
                            font-medium text-gray-700 dark:text-gray-300
                            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {resolvedCancelText}
                    </button>

                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm
                            font-medium flex items-center justify-center gap-2 transition-colors
                            disabled:opacity-60"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {resolvedConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
