"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import { APP_ROUTES } from "@/constants";
import type { LoginPayload } from "../types";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    // login() trả về Profile | null — dùng trực tiếp, không dùng user từ store
    // (store cập nhật async, user chưa re-render kịp tại đây → race condition).
    const profile = await login(form);
    if (!profile) return;

    // ── Redirect về root — root page tự phân luồng theo role ────────────────
    //  (admin → /admin, 1 club → /club/{slug}/dashboard, 2+ → clubs list,
    //   0 club → NoClub). Xem src/app/[locale]/page.tsx.
    router.push(APP_ROUTES.home);
    router.refresh();
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
