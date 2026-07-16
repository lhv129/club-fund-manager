"use client";

/**
 * RichEditor — wrapper CKEditor 5 Classic Build cho Next.js App Router.
 *
 * Cách dùng:
 *   import RichEditor from "@/components/shared/ui/RichEditor";
 *   <RichEditor value={html} onChange={(v) => setHtml(v)} />
 *
 * Cài đặt (một lần):
 *   npm install @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic
 *
 * Dark mode:
 *   CKEditor 5 Classic dùng CSS riêng — thêm vào globals.css (xem cuối file).
 */

import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Border đỏ khi có lỗi validation */
    hasError?: boolean;
    /** Chiều cao tối thiểu vùng soạn thảo (px, mặc định 160) */
    minHeight?: number;
    disabled?: boolean;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Lazy-load CKEditor hoàn toàn client-side để tránh lỗi SSR.
 * Next.js App Router vẫn SSR "use client" components nên PHẢI dùng
 * dynamic import bên trong useEffect — KHÔNG import trực tiếp ở top level.
 */
export default function RichEditor({
    value,
    onChange,
    placeholder,
    hasError = false,
    minHeight = 160,
    disabled = false,
    className = "",
}: RichEditorProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [EditorComponent, setEditorComponent] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ClassicEditor, setClassicEditor] = useState<any>(null);
    const [ready, setReady] = useState(false);

    // Tránh gọi onChange khi chính component đang set value từ ngoài vào
    const suppressRef = useRef(false);

    useEffect(() => {
        // Import cả hai module cùng lúc
        Promise.all([
            import("@ckeditor/ckeditor5-react"),
            import("@ckeditor/ckeditor5-build-classic"),
        ])
            .then(([ckReact, ckBuild]) => {
                setEditorComponent(() => ckReact.CKEditor);
                setClassicEditor(() => ckBuild.default);
                setReady(true);
            })
            .catch((err) => {
                console.error("[RichEditor] Failed to load CKEditor:", err);
            });
    }, []);

    // ── Skeleton khi chưa load xong ──────────────────────────────────────────
    if (!ready || !EditorComponent || !ClassicEditor) {
        return (
            <div
                style={{ minHeight }}
                className={[
                    "rounded-xl border animate-pulse",
                    "bg-gray-50 dark:bg-gray-800",
                    hasError
                        ? "border-rose-400 dark:border-rose-500"
                        : "border-gray-200 dark:border-gray-700",
                    className,
                ].join(" ")}
            />
        );
    }

    // ── Render CKEditor ───────────────────────────────────────────────────────
    return (
        <div
            className={[
                "ck-editor-root w-full overflow-hidden rounded-xl border transition-colors",
                hasError
                    ? "border-rose-400 dark:border-rose-500"
                    : "border-gray-200 dark:border-gray-700",
                disabled ? "opacity-60 pointer-events-none" : "",
                className,
            ].join(" ")}
        >
            <EditorComponent
                editor={ClassicEditor}
                data={value}
                disabled={disabled}
                config={{
                    placeholder,
                    toolbar: {
                        shouldNotGroupWhenFull: true,
                    },
                }}
                onReady={(editor: any) => {
                    const editable = editor.ui.view.editable?.element as HTMLElement | undefined;

                    if (editable) {
                        editable.style.minHeight = `${minHeight}px`;
                        editable.style.width = "100%";
                    }
                }}
                onChange={(_event: unknown, editor: any) => {
                    onChange(editor.getData());
                }}
            />
        </div>
    );
}

/*
 * ─── globals.css (thêm vào dự án một lần) ────────────────────────────────────
 *
 * /* CKEditor 5 Classic — dark mode overrides *\/
 * .dark .ck.ck-editor__main > .ck-editor__editable {
 *     background: #1f2937 !important;   /* gray-800 *\/
 *     color: #f3f4f6 !important;        /* gray-100 *\/
 *     border-color: #374151 !important; /* gray-700 *\/
 * }
 * .dark .ck.ck-toolbar {
 *     background: #111827 !important;   /* gray-900 *\/
 *     border-color: #374151 !important;
 * }
 * .dark .ck.ck-toolbar .ck-button {
 *     color: #d1d5db !important;        /* gray-300 *\/
 * }
 * .dark .ck.ck-toolbar .ck-button:hover,
 * .dark .ck.ck-toolbar .ck-button.ck-on {
 *     background: #374151 !important;
 * }
 * .dark .ck.ck-dropdown__panel,
 * .dark .ck.ck-list {
 *     background: #1f2937 !important;
 *     border-color: #374151 !important;
 * }
 * .dark .ck.ck-list__item .ck-button {
 *     color: #d1d5db !important;
 * }
 * .dark .ck.ck-list__item .ck-button:hover {
 *     background: #374151 !important;
 * }
 */
