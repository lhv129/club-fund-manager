"use client";

import React, {
    useState, useRef, useEffect, useCallback,
    type ReactNode, type KeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";

// ── Types ──────────────────────────────────────────────────────

type Segment = "dd" | "mm" | "yyyy";

export interface DatePickerProps {
    /** Giá trị hiện tại dạng yyyy-mm-dd */
    value?: string;
    /** Callback trả về yyyy-mm-dd khi thay đổi */
    onChange?: (v: string) => void;
    /** Icon bên trái — click mở/đóng calendar */
    leftIcon?: ReactNode;
    /** Icon bên phải — click mở/đóng calendar */
    rightIcon?: ReactNode;
    className?: string;
    rounded?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    wrapperClassName?: string;
}

// ── Helpers ────────────────────────────────────────────────────

function pad2(n: number | string) {
    return String(n).padStart(2, "0");
}

function parseIso(iso: string) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { d: "", m: "", y: "" };
    const [y, m, d] = iso.split("-");
    return { d, m, y };
}

function daysInMonth(month: number, year: number) {
    return new Date(year, month, 0).getDate();
}

// ── Mini Calendar dropdown ─────────────────────────────────────

function Calendar({
    selectedIso,
    onSelect,
}: {
    selectedIso: string;
    onSelect: (iso: string) => void;
}) {
    const locale = useLocale();
    const t = useTranslations("common");

    const today = new Date();
    const sel = selectedIso ? new Date(selectedIso + "T00:00:00") : null;

    const [viewYear, setViewYear] = useState(
        sel ? sel.getFullYear() : today.getFullYear()
    );
    const [viewMonth, setViewMonth] = useState(
        sel ? sel.getMonth() + 1 : today.getMonth() + 1
    );

    useEffect(() => {
        if (sel) {
            setViewYear(sel.getFullYear());
            setViewMonth(sel.getMonth() + 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIso]);

    // ── i18n: tên tháng và thứ dùng Intl — không cần import vì Intl là
    // built-in global của JavaScript runtime (như Math, Date, JSON).
    const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" })
        .format(new Date(viewYear, viewMonth - 1));

    const headerLabel =
        `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${viewYear}`;

    // Tiêu đề cột thứ bắt đầu từ Thứ Hai (2025-01-06 = Monday)
    const weekHeaders = Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" })
            .format(new Date(2025, 0, 6 + i))
    );

    // ── Grid tháng ────────────────────────────────────────────
    const totalDays = daysInMonth(viewMonth, viewYear);
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
    const startOffset = (firstDow + 6) % 7; // Mon = 0

    const cells: Array<number | null> = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    const prevMonth = () => {
        if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const isSelected = (d: number) =>
        sel &&
        sel.getFullYear() === viewYear &&
        sel.getMonth() + 1 === viewMonth &&
        sel.getDate() === d;

    const isToday = (d: number) =>
        today.getFullYear() === viewYear &&
        today.getMonth() + 1 === viewMonth &&
        today.getDate() === d;

    const handleTodayClick = () => {
        const now = new Date();
        onSelect(
            `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
        );
    };

    return (
        <div className="p-3 w-[17rem] select-none">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={prevMonth}
                    className="p-1 rounded
                        text-gray-500 dark:text-gray-400
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        hover:text-gray-700 dark:hover:text-gray-200
                        transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {headerLabel}
                </span>

                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={nextMonth}
                    className="p-1 rounded
                        text-gray-500 dark:text-gray-400
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        hover:text-gray-700 dark:hover:text-gray-200
                        transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* ── Tiêu đề thứ (Intl, tự động locale) ─────────── */}
            <div className="grid grid-cols-7 mb-1">
                {weekHeaders.map((h) => (
                    <div
                        key={h}
                        className="text-center text-[10px] font-medium
                            text-gray-400 dark:text-gray-500 py-1"
                    >
                        {h}
                    </div>
                ))}
            </div>

            {/* ── Grid ngày ─────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((d, i) => (
                    <div key={i} className="flex items-center justify-center h-8">
                        {d != null && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                    onSelect(
                                        `${viewYear}-${pad2(viewMonth)}-${pad2(d)}`
                                    )
                                }
                                className={[
                                    "w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors",
                                    isSelected(d)
                                        ? "bg-[#2F529F] text-white"
                                        : isToday(d)
                                            ? "border border-[#2F529F] text-[#2F529F] dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                                ].join(" ")}
                            >
                                {d}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Nút "Hôm nay" / "Today" (i18n) ───────────────── */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleTodayClick}
                    className="text-xs text-[#2F529F] dark:text-blue-400 hover:underline transition-colors"
                >
                    {t("today")}
                </button>
            </div>
        </div>
    );
}

// ── DatePicker ─────────────────────────────────────────────────

const DatePicker: React.FC<DatePickerProps> = ({
    value = "",
    onChange,
    leftIcon,
    rightIcon,
    className = "",
    rounded = "rounded-lg",
    disabled = false,
    id,
    name,
    wrapperClassName = "",
}) => {
    const { d: initD, m: initM, y: initY } = parseIso(value);
    const [day, setDay] = useState(initD);
    const [month, setMonth] = useState(initM);
    const [year, setYear] = useState(initY);

    const [activeSeg, setActiveSeg] = useState<Segment | null>(null);

    // ── useRef thay vì useState cho typing buffer ──────────────
    // Lý do: useState là async/batched — khi gõ nhanh liên tiếp,
    // keystroke thứ 2 đến trước khi state từ keystroke thứ 1 được
    // commit, dẫn đến stale closure (buf vẫn là "" thay vì "1").
    // useRef luôn trả về giá trị hiện tại ngay lập tức.
    const typingBuf = useRef("");

    const [showCal, setShowCal] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const hasLeft = !!leftIcon;
    const hasRight = !!rightIcon;

    // ── Sync external value ────────────────────────────────────
    useEffect(() => {
        const { d, m, y } = parseIso(value);
        setDay(d);
        setMonth(m);
        setYear(y);
    }, [value]);

    // ── Emit yyyy-mm-dd ────────────────────────────────────────
    const emit = useCallback(
        (d: string, m: string, y: string) => {
            if (d && m && y && y.length === 4) {
                onChange?.(`${y}-${m}-${d}`);
            }
        },
        [onChange]
    );

    // ── Click outside → close ──────────────────────────────────
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                !containerRef.current?.contains(target) &&
                !calendarRef.current?.contains(target)
            ) {
                setShowCal(false);
                setActiveSeg(null);
                typingBuf.current = "";
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    // ── Segment navigation ─────────────────────────────────────
    const ORDER: Segment[] = ["dd", "mm", "yyyy"];

    const goNext = useCallback((cur: Segment) => {
        const idx = ORDER.indexOf(cur);
        if (idx < ORDER.length - 1) {
            typingBuf.current = "";
            setActiveSeg(ORDER[idx + 1]);
        }
    }, []);

    const goPrev = useCallback((cur: Segment) => {
        const idx = ORDER.indexOf(cur);
        if (idx > 0) {
            typingBuf.current = "";
            setActiveSeg(ORDER[idx - 1]);
        }
    }, []);

    // ── Activate a segment ─────────────────────────────────────
    const activate = (seg: Segment) => {
        if (disabled) return;
        typingBuf.current = "";
        setActiveSeg(seg);
        setShowCal(true);
        containerRef.current?.focus();
    };

    // ── Keyboard handler ───────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!activeSeg || disabled) return;

        const isDigit = e.key >= "0" && e.key <= "9";

        if (isDigit) {
            e.preventDefault();
            const dk = e.key;
            // Đọc/ghi trực tiếp trên ref — không bao giờ stale
            const newBuf = typingBuf.current + dk;

            if (activeSeg === "dd") {
                if (newBuf.length === 1) {
                    const n = parseInt(dk);
                    if (n >= 4) {
                        // Chỉ 1 chữ số đã xác định ngày (4–9) → commit ngay
                        const val = pad2(n);
                        typingBuf.current = "";
                        setDay(val);
                        emit(val, month, year);
                        goNext("dd");
                    } else {
                        // Có thể còn chữ số thứ 2 → chờ
                        typingBuf.current = newBuf;
                        setDay(pad2(n));
                    }
                } else {
                    const v = Math.max(1, Math.min(31, parseInt(newBuf)));
                    const val = pad2(v);
                    typingBuf.current = "";
                    setDay(val);
                    emit(val, month, year);
                    goNext("dd");
                }
            } else if (activeSeg === "mm") {
                if (newBuf.length === 1) {
                    const n = parseInt(dk);
                    if (n >= 2) {
                        // Tháng 2–9 chỉ cần 1 chữ số
                        const val = pad2(n);
                        typingBuf.current = "";
                        setMonth(val);
                        emit(day, val, year);
                        goNext("mm");
                    } else {
                        typingBuf.current = newBuf;
                        setMonth(pad2(n));
                    }
                } else {
                    const v = Math.max(1, Math.min(12, parseInt(newBuf)));
                    const val = pad2(v);
                    typingBuf.current = "";
                    setMonth(val);
                    emit(day, val, year);
                    goNext("mm");
                }
            } else if (activeSeg === "yyyy") {
                // Lấy 4 ký tự cuối để gõ cuốn
                const buf = (typingBuf.current + dk).slice(-4);
                typingBuf.current = buf;
                setYear(buf);
                if (buf.length === 4) {
                    const v = Math.max(1900, Math.min(2100, parseInt(buf)));
                    const val = String(v);
                    typingBuf.current = "";
                    setYear(val);
                    emit(day, month, val);
                }
            }
            return;
        }

        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const delta = e.key === "ArrowUp" ? 1 : -1;
            if (activeSeg === "dd") {
                const max =
                    month && year && year.length === 4
                        ? daysInMonth(parseInt(month), parseInt(year))
                        : 31;
                const cur = parseInt(day) || 1;
                const next = ((cur - 1 + delta + max) % max) + 1;
                const val = pad2(next);
                setDay(val);
                emit(val, month, year);
            } else if (activeSeg === "mm") {
                const cur = parseInt(month) || 1;
                const next = ((cur - 1 + delta + 12) % 12) + 1;
                const val = pad2(next);
                setMonth(val);
                emit(day, val, year);
            } else if (activeSeg === "yyyy") {
                const cur = parseInt(year) || new Date().getFullYear();
                const next = Math.max(1900, Math.min(2100, cur + delta));
                const val = String(next);
                setYear(val);
                emit(day, month, val);
            }
            return;
        }

        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(activeSeg); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(activeSeg); return; }

        if (e.key === "Tab") {
            const idx = ORDER.indexOf(activeSeg);
            if (!e.shiftKey && idx < ORDER.length - 1) {
                e.preventDefault();
                goNext(activeSeg);
            } else if (e.shiftKey && idx > 0) {
                e.preventDefault();
                goPrev(activeSeg);
            } else {
                typingBuf.current = "";
                setShowCal(false);
                setActiveSeg(null);
            }
            return;
        }

        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            typingBuf.current = "";
            if (activeSeg === "dd") setDay("");
            if (activeSeg === "mm") setMonth("");
            if (activeSeg === "yyyy") setYear("");
            onChange?.("");
            return;
        }

        if (e.key === "Escape") {
            typingBuf.current = "";
            setShowCal(false);
            setActiveSeg(null);
        }
    };

    // ── Calendar: user chọn ngày ───────────────────────────────
    const handleCalSelect = (iso: string) => {
        const { d, m, y } = parseIso(iso);
        setDay(d);
        setMonth(m);
        setYear(y);
        onChange?.(iso);
        typingBuf.current = "";
        setShowCal(false);
        setActiveSeg(null);
    };

    // ── Segment display values ─────────────────────────────────
    const dDisplay = day || "dd";
    const mDisplay = month || "mm";
    const yDisplay = year || "yyyy";

    const segPlaceholderCls = (seg: Segment, hasVal: boolean) =>
        activeSeg === seg
            ? "bg-[#2F529F] text-white rounded px-0.5 -mx-0.5"
            : hasVal
                ? "text-gray-700 dark:text-gray-200"
                : "text-gray-400 dark:text-gray-500";

    const currentIso =
        day && month && year && year.length === 4
            ? `${year}-${month}-${day}`
            : "";

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className={`relative w-full ${wrapperClassName}`}>

            {/* Icon trái */}
            {hasLeft && (
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        if (disabled) return;
                        setShowCal(v => !v);
                        if (!activeSeg) setActiveSeg("dd");
                        containerRef.current?.focus();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                        text-neutral-400 dark:text-neutral-500
                        hover:text-neutral-600 dark:hover:text-neutral-300
                        focus:outline-none disabled:cursor-not-allowed transition-colors"
                >
                    {leftIcon}
                </button>
            )}

            {/* Segmented input container */}
            <div
                ref={containerRef}
                id={id}
                tabIndex={disabled ? -1 : 0}
                role="group"
                aria-label="Date input"
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (!activeSeg && !disabled) {
                        setActiveSeg("dd");
                        setShowCal(true);
                    }
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && !disabled) {
                        setActiveSeg("dd");
                        setShowCal(true);
                    }
                }}
                className={[
                    "flex items-center gap-0",
                    "border",
                    "bg-white dark:bg-neutral-900",
                    "border-neutral-200 dark:border-neutral-700",
                    rounded,
                    "h-11 px-4 py-3",
                    hasLeft ? "pl-10" : "",
                    hasRight ? "pr-10" : "",
                    "outline-none focus:border-primary-300 dark:focus:border-primary-500",
                    "cursor-default",
                    disabled ? "opacity-60 cursor-not-allowed" : "",
                    className,
                ].join(" ")}
            >
                {/* dd */}
                <span
                    className={`text-base font-light cursor-default transition-colors ${segPlaceholderCls("dd", !!day)}`}
                    onClick={(e) => { e.stopPropagation(); activate("dd"); }}
                >
                    {dDisplay}
                </span>

                <span className="text-gray-400 dark:text-gray-600 font-light select-none mx-[1px]">/</span>

                {/* mm */}
                <span
                    className={`text-base font-light cursor-default transition-colors ${segPlaceholderCls("mm", !!month)}`}
                    onClick={(e) => { e.stopPropagation(); activate("mm"); }}
                >
                    {mDisplay}
                </span>

                <span className="text-gray-400 dark:text-gray-600 font-light select-none mx-[1px]">/</span>

                {/* yyyy */}
                <span
                    className={`text-base font-light cursor-default transition-colors ${segPlaceholderCls("yyyy", !!year)}`}
                    onClick={(e) => { e.stopPropagation(); activate("yyyy"); }}
                >
                    {yDisplay}
                </span>
            </div>

            {/* Icon phải */}
            {hasRight && (
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        if (disabled) return;
                        setShowCal(v => !v);
                        if (!activeSeg) setActiveSeg("dd");
                        containerRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                        text-neutral-400 dark:text-neutral-500
                        hover:text-neutral-600 dark:hover:text-neutral-300
                        focus:outline-none disabled:cursor-not-allowed transition-colors"
                >
                    {rightIcon}
                </button>
            )}

            {/* Hidden input cho form submit */}
            <input type="hidden" name={name} value={currentIso} />

            {/* Calendar dropdown */}
            {showCal && !disabled && (
                <div
                    ref={calendarRef}
                    className="absolute top-full left-0 mt-1 z-50
                        bg-white dark:bg-gray-900
                        border border-neutral-200 dark:border-neutral-700
                        rounded-xl shadow-lg"
                >
                    <Calendar selectedIso={currentIso} onSelect={handleCalSelect} />
                </div>
            )}
        </div>
    );
};

DatePicker.displayName = "DatePicker";
export default DatePicker;
