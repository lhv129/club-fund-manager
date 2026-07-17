"use client";

import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Eraser,
    Image as ImageIcon,
    Indent,
    Italic,
    Link,
    List,
    ListOrdered,
    Minus,
    Outdent,
    Quote,
    Redo2,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    Underline,
    Undo2,
    X,
} from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface RichEditorProps {
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    minHeight?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Separator() {
    return <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />;
}

// ─── RichEditor ───────────────────────────────────────────────────────────────

export function RichEditor({
    value,
    onChange,
    placeholder = "",
    error,
    minHeight = 260,
}: RichEditorProps) {
    const t = useTranslations("richEditor");

    const editorRef = useRef<HTMLDivElement>(null);
    const lastValueRef = useRef<string>("");
    const savedRangeRef = useRef<Range | null>(null);

    const [isEmpty, setIsEmpty] = useState(true);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showTableInput, setShowTableInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [tableRows, setTableRows] = useState("3");
    const [tableCols, setTableCols] = useState("3");
    const [fontSize, setFontSize] = useState("3");
    const [fontFamily, setFontFamily] = useState("inherit");

    const htmlValue = value ?? "";

    useLayoutEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (lastValueRef.current !== htmlValue) {
            el.innerHTML = htmlValue;
            lastValueRef.current = htmlValue;
            setIsEmpty(!htmlValue || htmlValue === "<br>");
        }
    }, [htmlValue]);

    const updateActiveFormats = useCallback(() => {
        const formats = new Set<string>();
        const cmds = [
            "bold", "italic", "underline", "strikeThrough",
            "justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
            "insertUnorderedList", "insertOrderedList",
            "superscript", "subscript",
        ];
        cmds.forEach((cmd) => {
            try { if (document.queryCommandState(cmd)) formats.add(cmd); } catch { }
        });
        setActiveFormats(formats);
    }, []);

    const syncChange = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const next = el.innerHTML ?? "";
        lastValueRef.current = next;
        setIsEmpty(!next || next === "<br>");
        onChange(next);
        updateActiveFormats();
    }, [onChange, updateActiveFormats]);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const range = savedRangeRef.current;
        if (!range) return;
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    };

    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        syncChange();
    };

    // ── Link ─────────────────────────────────────────────────────────────────

    const openLinkInput = () => {
        saveSelection();
        setShowTableInput(false);
        setShowLinkInput((v) => !v);
    };

    const insertLink = () => {
        const url = linkUrl.trim();
        if (!url) return;
        restoreSelection();
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            document.execCommand("createLink", false, url);
        } else {
            const a = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            document.execCommand("insertHTML", false, a);
        }
        setLinkUrl("");
        setShowLinkInput(false);
        syncChange();
    };

    // ── Image ─────────────────────────────────────────────────────────────────

    const insertImageFromFile = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const src = ev.target?.result as string;
                editorRef.current?.focus();
                document.execCommand(
                    "insertHTML",
                    false,
                    `<img src="${src}" style="max-width:100%;height:auto;border-radius:6px;margin:4px 0;" />`
                );
                syncChange();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // ── Table ─────────────────────────────────────────────────────────────────

    const openTableInput = () => {
        saveSelection();
        setShowLinkInput(false);
        setShowTableInput((v) => !v);
    };

    const insertTable = () => {
        const r = Math.max(1, Math.min(20, parseInt(tableRows) || 3));
        const c = Math.max(1, Math.min(10, parseInt(tableCols) || 3));
        const cellStyle = "border:1px solid #e5e7eb;padding:6px 10px;min-width:80px;";
        let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0;">`;
        for (let i = 0; i < r; i++) {
            html += "<tr>";
            for (let j = 0; j < c; j++) {
                html += i === 0
                    ? `<th style="${cellStyle}background:#f9fafb;font-weight:600;"></th>`
                    : `<td style="${cellStyle}"></td>`;
            }
            html += "</tr>";
        }
        html += "</table><p></p>";
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand("insertHTML", false, html);
        setShowTableInput(false);
        syncChange();
    };

    // ── Paste (images) ────────────────────────────────────────────────────────

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const src = ev.target?.result as string;
                    editorRef.current?.focus();
                    document.execCommand(
                        "insertHTML",
                        false,
                        `<img src="${src}" style="max-width:100%;height:auto;border-radius:6px;margin:4px 0;" />`
                    );
                    syncChange();
                };
                reader.readAsDataURL(file);
                return;
            }
        }
    };

    // ── Blockquote ────────────────────────────────────────────────────────────

    const insertBlockquote = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            exec(
                "insertHTML",
                `<blockquote style="border-left:3px solid #6366f1;margin:8px 0;padding:6px 12px;color:#6b7280;font-style:italic;"></blockquote>`
            );
            return;
        }
        const range = sel.getRangeAt(0);
        const bq = document.createElement("blockquote");
        bq.style.cssText =
            "border-left:3px solid #6366f1;margin:8px 0;padding:6px 12px;color:#6b7280;font-style:italic;";
        try {
            range.surroundContents(bq);
        } catch {
            bq.appendChild(range.extractContents());
            range.insertNode(bq);
        }
        syncChange();
    };

    // ── Styles ────────────────────────────────────────────────────────────────

    const isActive = (cmd: string) => activeFormats.has(cmd);

    const btn = (active = false, title = "") =>
    ({
        type: "button" as const,
        title,
        className: `inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0 ${active
            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`,
    });

    const wordCount = editorRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length ?? 0;

    return (
        <div
            className={`rounded-xl border bg-white dark:bg-gray-800 overflow-hidden transition-colors ${error
                ? "border-rose-400 dark:border-rose-500"
                : "border-gray-200 dark:border-gray-700"
                }`}
        >
            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 select-none">
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">

                    {/* Paragraph style */}
                    <select
                        defaultValue="p"
                        onChange={(e) => exec("formatBlock", e.target.value)}
                        className="h-8 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="p">{t("paragraph")}</option>
                        <option value="h1">{t("heading1")}</option>
                        <option value="h2">{t("heading2")}</option>
                        <option value="h3">{t("heading3")}</option>
                        <option value="h4">{t("heading4")}</option>
                    </select>

                    {/* Font family */}
                    <select
                        value={fontFamily}
                        onChange={(e) => {
                            setFontFamily(e.target.value);
                            exec("fontName", e.target.value);
                        }}
                        className="h-8 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="inherit">{t("defaultFont")}</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="'Times New Roman'">Times New Roman</option>
                        <option value="'Courier New'">Courier New</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Tahoma">Tahoma</option>
                    </select>

                    {/* Font size */}
                    <select
                        value={fontSize}
                        onChange={(e) => {
                            setFontSize(e.target.value);
                            exec("fontSize", e.target.value);
                        }}
                        className="h-8 w-16 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="1">8px</option>
                        <option value="2">10px</option>
                        <option value="3">12px</option>
                        <option value="4">14px</option>
                        <option value="5">18px</option>
                        <option value="6">24px</option>
                        <option value="7">36px</option>
                    </select>

                    <Separator />

                    {/* Text formatting */}
                    <button {...btn(isActive("bold"), t("bold"))} onClick={() => exec("bold")}>
                        <Bold className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("italic"), t("italic"))} onClick={() => exec("italic")}>
                        <Italic className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("underline"), t("underline"))} onClick={() => exec("underline")}>
                        <Underline className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("strikeThrough"), t("strikethrough"))} onClick={() => exec("strikeThrough")}>
                        <Strikethrough className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("superscript"), t("superscript"))} onClick={() => exec("superscript")}>
                        <Superscript className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("subscript"), t("subscript"))} onClick={() => exec("subscript")}>
                        <Subscript className="w-4 h-4" />
                    </button>

                    <Separator />

                    {/* Text color */}
                    <label
                        title={t("textColor")}
                        className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                    >
                        <span className="text-sm font-bold leading-none" style={{ textDecoration: "underline solid currentColor" }}>A</span>
                        <input
                            type="color"
                            defaultValue="#000000"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => exec("foreColor", e.target.value)}
                        />
                    </label>

                    {/* Highlight color */}
                    <label
                        title={t("highlightColor")}
                        className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                    >
                        <span className="text-xs font-bold px-0.5 rounded" style={{ background: "#fef08a" }}>H</span>
                        <input
                            type="color"
                            defaultValue="#fef08a"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => exec("hiliteColor", e.target.value)}
                        />
                    </label>

                    <Separator />

                    {/* Alignment */}
                    <button {...btn(isActive("justifyLeft"), t("alignLeft"))} onClick={() => exec("justifyLeft")}>
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("justifyCenter"), t("alignCenter"))} onClick={() => exec("justifyCenter")}>
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("justifyRight"), t("alignRight"))} onClick={() => exec("justifyRight")}>
                        <AlignRight className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("justifyFull"), t("alignJustify"))} onClick={() => exec("justifyFull")}>
                        <AlignJustify className="w-4 h-4" />
                    </button>

                    <Separator />

                    {/* Lists & indent */}
                    <button {...btn(isActive("insertUnorderedList"), t("bulletList"))} onClick={() => exec("insertUnorderedList")}>
                        <List className="w-4 h-4" />
                    </button>
                    <button {...btn(isActive("insertOrderedList"), t("numberedList"))} onClick={() => exec("insertOrderedList")}>
                        <ListOrdered className="w-4 h-4" />
                    </button>
                    <button {...btn(false, t("indent"))} onClick={() => exec("indent")}>
                        <Indent className="w-4 h-4" />
                    </button>
                    <button {...btn(false, t("outdent"))} onClick={() => exec("outdent")}>
                        <Outdent className="w-4 h-4" />
                    </button>

                    <Separator />

                    {/* Insert */}
                    <button {...btn(showLinkInput, t("insertLink"))} onClick={openLinkInput}>
                        <Link className="w-4 h-4" />
                    </button>

                    <button {...btn(false, t("insertImage"))} onClick={insertImageFromFile}>
                        <ImageIcon className="w-4 h-4" />
                    </button>

                    <button {...btn(showTableInput, t("insertTable"))} onClick={openTableInput}>
                        <Table className="w-4 h-4" />
                    </button>

                    <button {...btn(false, t("blockquote"))} onClick={insertBlockquote}>
                        <Quote className="w-4 h-4" />
                    </button>

                    <button {...btn(false, t("horizontalRule"))} onClick={() => exec("insertHorizontalRule")}>
                        <Minus className="w-4 h-4" />
                    </button>

                    <Separator />

                    {/* Undo / Redo / Clear */}
                    <button {...btn(false, t("undo"))} onClick={() => exec("undo")}>
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button {...btn(false, t("redo"))} onClick={() => exec("redo")}>
                        <Redo2 className="w-4 h-4" />
                    </button>
                    <button {...btn(false, t("clearFormat"))} onClick={() => exec("removeFormat")}>
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Link input row ─────────────────────────────────────── */}
                {showLinkInput && (
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <Link className="w-4 h-4 text-indigo-400 shrink-0" />
                        <input
                            autoFocus
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); insertLink(); }
                                if (e.key === "Escape") { setShowLinkInput(false); setLinkUrl(""); }
                            }}
                            placeholder={t("linkPlaceholder")}
                            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={insertLink}
                            className="shrink-0 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                        >
                            {t("insertLinkBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* ── Table input row ────────────────────────────────────── */}
                {showTableInput && (
                    <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <Table className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-xs text-gray-500 shrink-0">{t("rows")}</span>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={tableRows}
                            onChange={(e) => setTableRows(e.target.value)}
                            className="w-14 h-7 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-500 shrink-0">{t("cols")}</span>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={tableCols}
                            onChange={(e) => setTableCols(e.target.value)}
                            className="w-14 h-7 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={insertTable}
                            className="shrink-0 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                        >
                            {t("insertTableBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTableInput(false)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Editor area ─────────────────────────────────────────────── */}
            <div className="relative">
                {isEmpty && placeholder && (
                    <div className="pointer-events-none absolute left-4 top-3 text-sm text-gray-400 select-none">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={syncChange}
                    onBlur={syncChange}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    onPaste={handlePaste}
                    className="rich-text-editor w-full px-4 py-3 text-sm text-gray-900 dark:text-white outline-none prose prose-sm dark:prose-invert max-w-none"
                    style={{ minHeight }}
                />
            </div>

            {/* ── Status bar ──────────────────────────────────────────────── */}
            <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                    {t("statusHint")}
                </p>
                {!isEmpty && (
                    <p className="text-[11px] text-gray-400">
                        {t("wordCount", { count: wordCount })}
                    </p>
                )}
            </div>
        </div>
    );
}