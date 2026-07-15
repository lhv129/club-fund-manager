"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/shared/ui/Button";
import { Input } from "@/components/shared/ui/Input";
import type { RegisterPayload } from "../types";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name) newErrors.first_name = tValidation("required");
    if (!form.last_name) newErrors.last_name = tValidation("required");
    if (!form.email) {
      newErrors.email = tValidation("required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = tValidation("email");
    }
    if (!form.password) {
      newErrors.password = tValidation("required");
    } else if (form.password.length < 6) {
      newErrors.password = tValidation("minPassword");
    }
    if (!form.confirm_password) {
      newErrors.confirm_password = tValidation("required");
    } else if (form.password !== form.confirm_password) {
      newErrors.confirm_password = tValidation("passwordMismatch");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    if (!validate()) return;

    const result = await register(form);
    if (result.success) {
      setSuccessMsg(result.message || '');
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  const updateField = (field: keyof RegisterPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (successMsg) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("firstName")}
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            error={errors.first_name}
          />
          <Input
            label={t("lastName")}
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            error={errors.last_name}
          />
        </div>

        <Input
          label={t("email")}
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label={t("password")}
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label={t("confirmPassword")}
          type="password"
          value={form.confirm_password}
          onChange={(e) => updateField("confirm_password", e.target.value)}
          error={errors.confirm_password}
          autoComplete="new-password"
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
