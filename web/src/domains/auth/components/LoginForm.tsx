"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clubServiceClient } from "@/domains/club/services/clubService";
import { canAccessClub } from "@/lib/permissions";
import { APP_ROUTES, clubDashboardRoute } from "@/constants";
import type { LoginPayload } from "../types";
import type { Club, Translation } from "@/domains/club/types";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const locale = useLocale();
  const { login, user, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState<LoginPayload>({
    login: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.login) newErrors.login = tValidation("required");
    if (!form.password) newErrors.password = tValidation("required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Lấy slug theo locale hiện tại từ club.translations. */
  const slugForLocale = (club: Club): string | undefined =>
    club.translations?.find((tr: Translation) => tr.locale === locale)?.slug ??
    club.translations?.[0]?.slug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const success = await login(form);
    if (!success) return;

    // ── Quyết định redirect sau login ──────────────────────────────────────
    //  1. Superadmin                → /admin
    //  2. Admin (system, no club)   → /admin
    //  3. Đúng 1 club truy cập được → /club/{slug}/dashboard
    //  4. 2+ clubs                  → /admin/clubs (trang chọn club)
    //  5. 0 club / lỗi fetch         → /admin/no-club (trang xin vào CLB)
    if (user?.is_superadmin || user?.is_system_admin) {
      router.push(APP_ROUTES.admin);
      router.refresh();
      return;
    }

    try {
      const res = await clubServiceClient.list({ limit: 100 });
      const clubs = (res.data ?? []).filter((c) =>
        user ? canAccessClub(user.permissions, user.is_superadmin, c.id) : false,
      );

      if (clubs.length === 1) {
        const slug = slugForLocale(clubs[0]);
        if (slug) {
          router.push(clubDashboardRoute(slug));
          router.refresh();
          return;
        }
      }

      if (clubs.length >= 2) {
        // 2+ clubs → trang chọn club
        router.push(APP_ROUTES.adminClubs);
        router.refresh();
        return;
      }

      // 0 club → trang xin vào CLB
      router.push(APP_ROUTES.noClub);
      router.refresh();
    } catch {
      // Lỗi fetch clubs → fallback về /admin/no-club (xem như chưa có club)
      router.push(APP_ROUTES.noClub);
      router.refresh();
    }
  };

  const updateField = (field: keyof LoginPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("loginField")}
          placeholder={t("loginFieldPlaceholder")}
          value={form.login}
          onChange={(e) => updateField("login", e.target.value)}
          error={errors.login}
          autoComplete="username"
        />

        <Input
          label={t("password")}
          type="password"
          placeholder={t("passwordPlaceholder")}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
