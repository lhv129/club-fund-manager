"use client";

import { createPortal } from "react-dom";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from "react";

import { useLocale, useTranslations } from "next-intl";

type DateParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

export interface DateTimePickerProps {
    /**
     * Giá trị dạng:
     * yyyy-MM-ddTHH:mm
     *
     * Ví dụ:
     * 2026-08-11T14:30
     */
    value?: string;

    /**
     * Callback trả về yyyy-MM-ddTHH:mm
     */
    onChange?: (value: string) => void;

    id?: string;
    name?: string;
    disabled?: boolean;
    className?: string;
    wrapperClassName?: string;

    /**
     * Placeholder khi chưa chọn ngày giờ
     */
    placeholder?: string;

    /**
     * Locale format ngày giờ.
     * Mặc định lấy từ next-intl.
     */
    locale?: string;

    /**
     * Bước phút.
     * Ví dụ: 1, 5, 10, 15, 30
     */
    minuteStep?: number;

    /**
     * Giới hạn ngày giờ.
     */
    min?: string;
    max?: string;

    /**
     * Cho phép xóa giá trị.
     */
    clearable?: boolean;

    /**
     * Icon bên trái.
     */
    leftIcon?: ReactNode;
};

function pad(value: number | string): string {
    return String(value).padStart(2, "0");
}

function parseDateTime(value?: string): DateParts | null {
    if (!value) {
        return null;
    }

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/,
    );

    if (!match) {
        return null;
    }

    const [, year, month, day, hour, minute] = match;

    const parsed: DateParts = {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
    };

    const date = new Date(
        parsed.year,
        parsed.month - 1,
        parsed.day,
        parsed.hour,
        parsed.minute,
    );

    const isValid =
        date.getFullYear() === parsed.year &&
        date.getMonth() === parsed.month - 1 &&
        date.getDate() === parsed.day &&
        date.getHours() === parsed.hour &&
        date.getMinutes() === parsed.minute;

    return isValid ? parsed : null;
}

function formatDateTime(date: DateParts): string {
    return `${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(
        date.hour,
    )}:${pad(date.minute)}`;
}

function formatDateKey(
    year: number,
    month: number,
    day: number,
): string {
    return `${year}-${pad(month)}-${pad(day)}`;
}

function getToday(): DateParts {
    const now = new Date();

    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
    };
}

function getDefaultTime(
    minuteStep: number,
): Pick<DateParts, "hour" | "minute"> {
    const now = new Date();

    let hour = now.getHours();
    let minute = Math.ceil(now.getMinutes() / minuteStep) * minuteStep;

    if (minute >= 60) {
        minute = 0;
        hour += 1;
    }

    if (hour >= 24) {
        hour = 23;
        minute = 59;
    }

    return {
        hour,
        minute,
    };
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOffset(year: number, month: number): number {
    const firstDay = new Date(year, month - 1, 1).getDay();

    // Thứ Hai = 0, ..., Chủ nhật = 6
    return (firstDay + 6) % 7;
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function IconCalendar({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M7 3v3m10-3v3M4.5 9.5h15M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"
            />
        </svg>
    );
}

function IconClock({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <circle cx="12" cy="12" r="8.5" strokeWidth={1.8} />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 7.5v5l3.25 2"
            />
        </svg>
    );
}

function IconChevronLeft({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m15 18-6-6 6-6"
            />
        </svg>
    );
}

function IconChevronRight({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m9 18 6-6-6-6"
            />
        </svg>
    );
}

function IconChevronDown({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 9 6 6 6-6"
            />
        </svg>
    );
}

function IconX({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m7 7 10 10M17 7 7 17"
            />
        </svg>
    );
}

function IconCheck({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m5 12 4.5 4.5L19 7"
            />
        </svg>
    );
}

export default function DateTimePicker({
    value,
    onChange,
    id,
    name,
    disabled = false,
    className = "",
    wrapperClassName = "",
    placeholder,
    locale,
    minuteStep = 5,
    min,
    max,
    clearable = true,
    leftIcon,
}: DateTimePickerProps) {
    const currentLocale = useLocale();
    const t = useTranslations("common");

    const resolvedLocale = locale ?? currentLocale;
    const resolvedPlaceholder =
        placeholder ?? t("selectDateTime");

    const rootRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const [internalValue, setInternalValue] = useState(value ?? "");
    const [open, setOpen] = useState(false);

    const safeMinuteStep = Math.min(
        60,
        Math.max(1, Math.floor(minuteStep || 5)),
    );

    const currentValue = value !== undefined ? value : internalValue;
    const selected = parseDateTime(currentValue);
    const today = useMemo(() => getToday(), []);

    const [viewYear, setViewYear] = useState(
        selected?.year ?? today.year,
    );

    const [viewMonth, setViewMonth] = useState(
        selected?.month ?? today.month,
    );

    const minDate = min?.slice(0, 10);
    const maxDate = max?.slice(0, 10);

    const updateValue = useCallback(
        (nextValue: string) => {
            setInternalValue(nextValue);
            onChange?.(nextValue);
        },
        [onChange],
    );

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (!selected) {
            return;
        }

        setViewYear(selected.year);
        setViewMonth(selected.month);
    }, [currentValue]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            const target = event.target as Node;

            const clickedInsideTrigger = rootRef.current?.contains(target);
            const clickedInsidePopover = popoverRef.current?.contains(target);

            if (!clickedInsideTrigger && !clickedInsidePopover) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick,
            );
        };
    }, []);

    const monthLabel = useMemo(() => {
        const label = new Intl.DateTimeFormat(resolvedLocale, {
            month: "long",
            year: "numeric",
        }).format(new Date(viewYear, viewMonth - 1, 1));

        return capitalize(label);
    }, [resolvedLocale, viewMonth, viewYear]);

    const weekDays = useMemo(() => {
        const monday = new Date(2024, 0, 1);

        return Array.from({ length: 7 }, (_, index) => {
            return new Intl.DateTimeFormat(resolvedLocale, {
                weekday: "short",
            }).format(
                new Date(
                    monday.getFullYear(),
                    monday.getMonth(),
                    monday.getDate() + index,
                ),
            );
        });
    }, [resolvedLocale]);

    const calendarCells = useMemo(() => {
        const totalDays = getDaysInMonth(viewYear, viewMonth);
        const offset = getFirstDayOffset(viewYear, viewMonth);

        const cells: Array<number | null> = [];

        for (let index = 0; index < offset; index += 1) {
            cells.push(null);
        }

        for (let day = 1; day <= totalDays; day += 1) {
            cells.push(day);
        }

        while (cells.length < 42) {
            cells.push(null);
        }

        return cells;
    }, [viewMonth, viewYear]);

    const formattedValue = useMemo(() => {
        if (!selected) {
            return "";
        }

        return new Intl.DateTimeFormat(resolvedLocale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(
            new Date(
                selected.year,
                selected.month - 1,
                selected.day,
                selected.hour,
                selected.minute,
            ),
        );
    }, [resolvedLocale, currentValue]);

    const timeValue = selected ?? {
        year: viewYear,
        month: viewMonth,
        day: today.day,
        hour: 9,
        minute: 0,
    };

    const isDateDisabled = useCallback(
        (year: number, month: number, day: number) => {
            const key = formatDateKey(year, month, day);

            if (minDate && key < minDate) {
                return true;
            }

            if (maxDate && key > maxDate) {
                return true;
            }

            return false;
        },
        [minDate, maxDate],
    );

    const isValueAllowed = useCallback(
        (nextValue: string) => {
            const parsed = parseDateTime(nextValue);

            if (!parsed) {
                return false;
            }

            if (min && nextValue < min.slice(0, 16)) {
                return false;
            }

            if (max && nextValue > max.slice(0, 16)) {
                return false;
            }

            return true;
        },
        [min, max],
    );

    const handleDateSelect = (day: number) => {
        if (isDateDisabled(viewYear, viewMonth, day)) {
            return;
        }

        const defaultTime = getDefaultTime(safeMinuteStep);

        const nextDate: DateParts = {
            year: viewYear,
            month: viewMonth,
            day,
            hour: selected?.hour ?? defaultTime.hour,
            minute: selected?.minute ?? defaultTime.minute,
        };

        const nextValue = formatDateTime(nextDate);

        if (!isValueAllowed(nextValue)) {
            return;
        }

        updateValue(nextValue);
    };

    const handleTimeChange = (
        type: "hour" | "minute",
        rawValue: string,
    ) => {
        const base = selected ?? {
            year: today.year,
            month: today.month,
            day: today.day,
            hour: 9,
            minute: 0,
        };

        const nextDate: DateParts = {
            ...base,
            [type]: Number(rawValue),
        };

        const nextValue = formatDateTime(nextDate);

        if (!isValueAllowed(nextValue)) {
            return;
        }

        updateValue(nextValue);
    };

    const handleToday = () => {
        const now = getToday();
        const nextValue = formatDateTime(now);

        if (!isValueAllowed(nextValue)) {
            return;
        }

        setViewYear(now.year);
        setViewMonth(now.month);
        updateValue(nextValue);
    };

    const handleNow = () => {
        const now = getToday();
        const nextValue = formatDateTime(now);

        if (!isValueAllowed(nextValue)) {
            return;
        }

        setViewYear(now.year);
        setViewMonth(now.month);
        updateValue(nextValue);
    };

    const handleClear = () => {
        updateValue("");
        setOpen(false);
    };

    const goToPreviousMonth = () => {
        if (viewMonth === 1) {
            setViewMonth(12);
            setViewYear((year) => year - 1);
            return;
        }

        setViewMonth((month) => month - 1);
    };

    const goToNextMonth = () => {
        if (viewMonth === 12) {
            setViewMonth(1);
            setViewYear((year) => year + 1);
            return;
        }

        setViewMonth((month) => month + 1);
    };

    const handleKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
    ) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
        }
    };

    const minuteOptions = useMemo(() => {
        const options: number[] = [];

        for (
            let minute = 0;
            minute < 60;
            minute += safeMinuteStep
        ) {
            options.push(minute);
        }

        return options;
    }, [safeMinuteStep]);

    const triggerIcon = leftIcon ?? (
        <IconCalendar className="h-5 w-5" />
    );

    return (
        <div
            ref={rootRef}
            className={`relative w-full ${wrapperClassName}`}
            onKeyDown={handleKeyDown}
        >
            <button
                id={id}
                type="button"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={formattedValue || resolvedPlaceholder}
                onClick={() => setOpen((current) => !current)}
                className={[
                    "group relative flex h-11 w-full items-center gap-3 rounded-xl border",
                    "bg-background px-3.5 pr-10 text-left text-sm transition-all",
                    "border-border text-foreground",
                    "hover:border-primary/50",
                    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    open ? "border-primary ring-2 ring-primary/15" : "",
                    className,
                ].join(" ")}
            >
                <span
                    className={[
                        "shrink-0 transition-colors",
                        open
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground",
                    ].join(" ")}
                >
                    {triggerIcon}
                </span>

                <span
                    className={[
                        "min-w-0 flex-1 truncate",
                        formattedValue
                            ? "text-foreground"
                            : "text-muted-foreground",
                    ].join(" ")}
                >
                    {formattedValue || resolvedPlaceholder}
                </span>

                {!clearable || !currentValue ? (
                    <IconChevronDown
                        className={[
                            "absolute right-3 h-4 w-4 text-muted-foreground transition-transform",
                            open ? "rotate-180 text-primary" : "",
                        ].join(" ")}
                    />
                ) : null}
            </button>

            {clearable && currentValue && !disabled ? (
                <button
                    type="button"
                    aria-label={t("clearDateTime")}
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <IconX className="h-4 w-4" />
                </button>
            ) : null}

            {name ? (
                <input
                    type="hidden"
                    name={name}
                    value={currentValue}
                />
            ) : null}

            {open && !disabled && typeof document !== "undefined"
                ? createPortal(
                    <>
                        <button
                            type="button"
                            aria-label={t("close")}
                            onClick={() => setOpen(false)}
                            className="
                  fixed inset-0 z-[99998]
                  cursor-default border-0
                  bg-black/35 p-0
                  backdrop-blur-[2px]
                  animate-in fade-in-0
                "
                        />

                        <div
                            ref={popoverRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label={t("selectDateTime")}
                            className="
                  fixed inset-x-0 bottom-0 z-[99999]
                  flex max-h-[92dvh] w-full flex-col
                  overflow-hidden
                  rounded-t-3xl border border-border
                  bg-background text-foreground
                  shadow-2xl shadow-black/25
                  animate-in fade-in-0 slide-in-from-bottom-5

                  sm:inset-x-1/2
                  sm:bottom-4
                  sm:w-[min(28rem,calc(100vw-2rem))]
                  sm:-translate-x-1/2
                  sm:rounded-3xl
                  sm:max-h-[calc(100dvh-2rem)]
                "
                        >
                            <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
                                <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                            </div>

                            <div className="relative shrink-0 border-b border-border bg-muted/30 px-4 pb-4 pr-14 pt-3 sm:px-5 sm:pr-14 sm:pt-5">
                                <button
                                    type="button"
                                    aria-label={t("close")}
                                    title={t("close")}
                                    onClick={() => setOpen(false)}
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:right-4 sm:top-4"
                                >
                                    <IconX className="h-5 w-5" />
                                </button>

                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                    <IconCalendar className="h-3.5 w-3.5" />
                                    {t("dateTime")}
                                </div>

                                <div className="truncate text-xl font-semibold leading-tight tracking-tight text-foreground">
                                    {formattedValue || t("dateTimeNotSelected")}
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                <div className="p-4 sm:p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <button
                                            type="button"
                                            aria-label={t("previousMonth")}
                                            onClick={goToPreviousMonth}
                                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <IconChevronLeft className="h-4 w-4" />
                                        </button>

                                        <div className="text-sm font-semibold text-foreground">
                                            {monthLabel}
                                        </div>

                                        <button
                                            type="button"
                                            aria-label={t("nextMonth")}
                                            onClick={goToNextMonth}
                                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <IconChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="mb-2 grid grid-cols-7">
                                        {weekDays.map((weekDay, index) => (
                                            <div
                                                key={`${weekDay}-${index}`}
                                                className={[
                                                    "flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-wide",
                                                    index >= 5
                                                        ? "text-primary/70"
                                                        : "text-muted-foreground",
                                                ].join(" ")}
                                            >
                                                {weekDay}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1">
                                        {calendarCells.map((day, index) => {
                                            if (day === null) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className="h-9"
                                                        aria-hidden="true"
                                                    />
                                                );
                                            }

                                            const dayKey = formatDateKey(
                                                viewYear,
                                                viewMonth,
                                                day,
                                            );

                                            const isSelected =
                                                selected &&
                                                selected.year === viewYear &&
                                                selected.month === viewMonth &&
                                                selected.day === day;

                                            const isToday =
                                                today.year === viewYear &&
                                                today.month === viewMonth &&
                                                today.day === day;

                                            const dayDisabled = isDateDisabled(
                                                viewYear,
                                                viewMonth,
                                                day,
                                            );

                                            return (
                                                <div
                                                    key={dayKey}
                                                    className="flex h-9 items-center justify-center"
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={dayDisabled}
                                                        aria-label={dayKey}
                                                        aria-current={
                                                            isToday ? "date" : undefined
                                                        }
                                                        onClick={() => handleDateSelect(day)}
                                                        className={[
                                                            "relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all",
                                                            "focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                            "disabled:cursor-not-allowed disabled:opacity-25",
                                                            isSelected
                                                                ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                                                                : isToday
                                                                    ? "font-semibold text-primary ring-1 ring-primary/60 hover:bg-primary/10"
                                                                    : "text-foreground hover:bg-muted",
                                                        ].join(" ")}
                                                    >
                                                        {day}

                                                        {isToday && !isSelected ? (
                                                            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                                                        ) : null}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 border-t border-border pt-4">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                            <IconClock className="h-3.5 w-3.5" />
                                            {t("time")}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative min-w-0 flex-1">
                                                <select
                                                    aria-label={t("hour")}
                                                    value={pad(timeValue.hour)}
                                                    onChange={(event) =>
                                                        handleTimeChange(
                                                            "hour",
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-sm font-medium text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {Array.from(
                                                        { length: 24 },
                                                        (_, hour) => (
                                                            <option
                                                                key={hour}
                                                                value={pad(hour)}
                                                            >
                                                                {pad(hour)}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>

                                            <span className="shrink-0 text-lg font-semibold text-muted-foreground">
                                                :
                                            </span>

                                            <div className="relative min-w-0 flex-1">
                                                <select
                                                    aria-label={t("minute")}
                                                    value={pad(timeValue.minute)}
                                                    onChange={(event) =>
                                                        handleTimeChange(
                                                            "minute",
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-sm font-medium text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {minuteOptions.map((minute) => (
                                                        <option
                                                            key={minute}
                                                            value={pad(minute)}
                                                        >
                                                            {pad(minute)}
                                                        </option>
                                                    ))}
                                                </select>

                                                <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="
                    flex shrink-0 flex-col gap-2
                    border-t border-border
                    bg-muted/20
                    px-4 py-3
                    pb-[calc(0.75rem+env(safe-area-inset-bottom))]
                    sm:flex-row sm:items-center sm:justify-between
                    sm:px-5 sm:py-4
                    sm:pb-4
                  "
                            >
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleToday}
                                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                                    >
                                        {t("today")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleNow}
                                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        {t("now")}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="
                      inline-flex w-full items-center justify-center gap-1.5
                      rounded-xl bg-primary
                      px-3 py-3
                      text-xs font-semibold text-primary-foreground
                      transition-colors hover:bg-primary/90
                      focus:outline-none focus:ring-2 focus:ring-primary/30
                      sm:w-auto sm:px-4 sm:py-2.5
                    "
                                >
                                    <IconCheck className="h-3.5 w-3.5" />
                                    {t("done")}
                                </button>
                            </div>
                        </div>
                    </>,
                    document.body,
                )
                : null}
        </div>
    );
}
