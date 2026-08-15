"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { SubmitResult } from "@/components/shared/forms/FormModal";
import Select from "@/components/shared/ui/Select";
import type { WebhookConfigType } from "@/domains/webhookConfig/types";

type Option = { value: string; label: string };

type Props = {
    isOpen: boolean;
    isAdmin: boolean;
    isEdit: boolean;
    submitting: boolean;
    clubOptions: Option[];
    bankOptions: Option[];
    initialValues: {
        club_slug: string;
        bank_account_id: string;
        type: WebhookConfigType;
    };
    onClubChange: (clubSlug: string) => void;
    onClose: () => void;
    onSubmit: (values: Record<string, string>) => Promise<SubmitResult>;
};

export function WebhookConfigFormModal({
    isOpen,
    isAdmin,
    isEdit,
    submitting,
    clubOptions,
    bankOptions,
    initialValues,
    onClubChange,
    onClose,
    onSubmit,
}: Props) {
    const t = useTranslations("common");
    const tw = useTranslations("webhookConfig");
    const [clubSlug, setClubSlug] = useState("");
    const [bankAccountId, setBankAccountId] = useState("");
    const [type, setType] = useState<WebhookConfigType>("sepay");
    const [secret, setSecret] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setClubSlug(initialValues.club_slug);
        setBankAccountId(initialValues.bank_account_id);
        setType(initialValues.type);
        setSecret("");
        setErrors({});
        onClubChange(initialValues.club_slug);
    }, [isOpen, initialValues.club_slug, initialValues.bank_account_id, initialValues.type, onClubChange]);

    if (!isOpen) return null;

    const handleClubChange = (value: string) => {
        setClubSlug(value);
        setBankAccountId("");
        setErrors((current) => ({ ...current, club_slug: "", bank_account_id: "" }));
        onClubChange(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">{isEdit ? tw("edit") : tw("create")}</h2>
                    <button type="button" onClick={onClose} aria-label={t("close")} className="rounded-md p-1.5 text-foreground-muted hover:bg-background-muted hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <form className="space-y-4 p-5" onSubmit={async (event) => {
                    event.preventDefault();
                    setErrors({});
                    const result = await onSubmit({ club_slug: clubSlug, bank_account_id: bankAccountId, type, webhook_secret: secret });
                    if (result && result.success === false) {
                        if (result.errors) {
                            setErrors(Object.fromEntries(
                                Object.entries(result.errors).map(([field, messages]) => [
                                    field,
                                    Array.isArray(messages) ? messages[0] ?? "" : "",
                                ]),
                            ));
                        }
                        toast.error(result.message || t("validationError"));
                    }
                }}>
                    {isAdmin && <div><Select label={tw("club")} options={clubOptions} value={clubSlug} onChange={handleClubChange} placeholder={tw("selectClub")} error={Boolean(errors.club_slug)} />{errors.club_slug && <p className="mt-1.5 text-xs text-rose-500">{errors.club_slug}</p>}</div>}
                    <div><Select label={tw("bankAccount")} options={bankOptions} value={bankAccountId} onChange={(value) => { setBankAccountId(value); setErrors((current) => ({ ...current, bank_account_id: "" })); }} placeholder={tw("selectBankAccount")} disabled={isAdmin && !clubSlug} error={Boolean(errors.bank_account_id)} />{errors.bank_account_id && <p className="mt-1.5 text-xs text-rose-500">{errors.bank_account_id}</p>}</div>
                    <div><Select label={tw("type")} options={[{ value: "sepay", label: "SePay" }, { value: "casso", label: "Casso" }]} value={type} onChange={(value) => { setType(value as WebhookConfigType); setErrors((current) => ({ ...current, type: "" })); }} error={Boolean(errors.type)} />{errors.type && <p className="mt-1.5 text-xs text-rose-500">{errors.type}</p>}</div>
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-foreground">{tw("webhookSecret")}</span>
                        <input value={secret} onChange={(event) => { setSecret(event.target.value); setErrors((current) => ({ ...current, webhook_secret: "" })); }} placeholder={isEdit ? tw("secretEditHint") : tw("secretPlaceholder")} className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 ${errors.webhook_secret ? "border-rose-500 focus:ring-rose-500/40" : "border-border focus:border-primary focus:ring-primary/40"}`} />
                        {errors.webhook_secret && <p className="mt-1.5 text-xs text-rose-500">{errors.webhook_secret}</p>}
                    </label>
                    <div className="flex justify-end gap-2 border-t border-border pt-4">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-muted">{t("cancel")}</button>
                        <button type="submit" disabled={submitting || !bankAccountId || (isAdmin && !clubSlug)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? t("save") : t("create")}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
