"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { LOCALES } from "@/lib/locales";

const DROPDOWN_WIDTH = 176; // = w-44
const VIEWPORT_PADDING = 8;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    let left = rect.right - DROPDOWN_WIDTH;
    left = Math.min(left, window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_PADDING);
    left = Math.max(left, VIEWPORT_PADDING);

    setCoords({ top: rect.bottom + 6, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const handleChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium
          text-zinc-700 dark:text-gray-300 bg-background
          transition-all duration-200
          hover:bg-zinc-100 dark:hover:bg-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Image
          src={current.flag}
          alt={current.label}
          width={18}
          height={18}
          className="rounded-full object-cover shrink-0"
        />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted &&
        open &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{ top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            className="animate-scale-in origin-top-right fixed rounded-xl border border-zinc-200 dark:border-gray-700
              bg-background shadow-lg overflow-hidden z-[100]"
          >
            {LOCALES.map((l) => {
              const isActive = l.code === locale;
              return (
                <button
                  key={l.code}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleChange(l.code)}
                  disabled={isPending}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150
                    ${isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-800"
                    }`}
                >
                  <Image
                    src={l.flag}
                    alt={l.label}
                    width={20}
                    height={20}
                    className="rounded-full object-cover shrink-0"
                  />
                  <span>{l.label}</span>
                  {isActive && (
                    <Check className="ml-auto h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-fade-in" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
