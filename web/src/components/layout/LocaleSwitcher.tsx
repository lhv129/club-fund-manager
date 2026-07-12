"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const locales = [
  {
    code: "vi",
    label: "Tiếng Việt",
    flag: "/icon/flag-for-flag-vietnam.svg",
  },
  {
    code: "en",
    label: "English",
    flag: "/icon/flag-for-flag-united-kingdom.svg",
  },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium
          text-zinc-700 dark:text-gray-300
          hover:bg-zinc-100 dark:hover:bg-gray-800
          transition-colors disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Image
          src={current.flag}
          alt={current.label}
          width={20}
          height={20}
          className="rounded-sm object-cover shrink-0"
        />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-zinc-200 dark:border-gray-700
            bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-50"
        >
          {locales.map((l) => {
            const isActive = l.code === locale;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={isActive}
                onClick={() => handleChange(l.code)}
                disabled={isPending}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                    : "text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-800"
                  }`}
              >
                <Image
                  src={l.flag}
                  alt={l.label}
                  width={22}
                  height={22}
                  className="rounded-sm object-cover shrink-0"
                />
                <span>{l.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
