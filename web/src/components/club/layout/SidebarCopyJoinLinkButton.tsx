"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils";
import { buildJoinLink } from "@/lib/invites";
import { getClubInviteService } from "@/domains/invites/services/ClubInviteService";

interface SidebarCopyJoinLinkButtonProps {
    slug: string; // club slug (locale-specific)
}

export function SidebarCopyJoinLinkButton({ slug }: SidebarCopyJoinLinkButtonProps) {
    const ti = useTranslations("invite");
    const tCommon = useTranslations("common");
    const locale = useLocale();

    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (loading || copied) return;
        setLoading(true);
        try {
            // Tạo invite tạm (no max_uses, no expires_at) → lấy invite_code
            const service = getClubInviteService(slug);
            const res = await service.create({ max_uses: null, expires_at: null });

            if (!res.success || !res.data) {
                toast.error(res.message || tCommon("loadError"));
                return;
            }

            const { invite_code, club } = res.data;
            // club.slug từ response — dùng trực tiếp, không phụ thuộc locale store
            const link = buildJoinLink(locale, club.slug, invite_code);

            try {
                await navigator.clipboard.writeText(link);
            } catch {
                // Fallback cho browser không hỗ trợ clipboard API
                const el = document.createElement("textarea");
                el.value = link;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err: any) {
            toast.error(err?.message || tCommon("loadError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCopy}
            disabled={loading}
            className={cn(
                "mt-2.5 w-full flex items-center justify-center gap-2",
                "px-3 py-2 rounded-lg text-xs font-medium",
                "border transition-all duration-150",
                copied
                    ? "border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-background-muted/60 text-foreground-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5",

                "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
        >
            {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : copied ? (
                <Check className="w-3.5 h-3.5" />
            ) : (
                <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? ti("copied") : ti("copyJoinLink")}
        </button>
    );
}
