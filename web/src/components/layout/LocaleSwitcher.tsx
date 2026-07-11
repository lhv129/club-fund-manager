"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";

const locales = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: string) => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          disabled={isPending}
          className={`rounded px-2 py-1 text-sm transition-colors ${
            locale === l.code
              ? "bg-blue-100 text-blue-700"
              : "text-zinc-500 hover:bg-zinc-100"
          }`}
          title={l.label}
        >
          <span className="mr-1">{l.flag}</span>
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
