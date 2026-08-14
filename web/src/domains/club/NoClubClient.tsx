"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Search, Ticket, ArrowRight, Loader2,
  Users, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import CustomImage from "@/components/shared/media/CustomImage";
import { clubServiceClient } from "@/domains/club/services/clubService";
import { getTranslation, getTranslatedSlug } from "@/lib/translations";
import type { Club } from "@/domains/club/types";
import { JoinSuccess } from "@/domains/club/components/JoinSuccess";
import { CursorLoadMore } from "@/components/shared/ui/CursorLoadMore";
import { ClubRowSkeleton } from "@/domains/club/components/ClubRowSkeleton";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { cn } from "@/utils";

const MIN_SEARCH_LENGTH = 2;
const PAGE_LIMIT = 10;

type Mode = "search" | "token";

interface CursorMeta {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export function NoClubClient() {
  const t = useTranslations("noClub");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("search");

  // ─── Search state ─────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [results, setResults] = useState<Club[]>([]);
  const [meta, setMeta] = useState<CursorMeta | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [joinClubSlug, setJoinClubSlug] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<{ name: string; message: string } | null>(null);

  // ─── Debounce ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [keyword]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "search") return;
    const trimmed = debouncedKeyword.trim();
    if (trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH) return;

    let cancelled = false;
    setSearching(true);

    clubServiceClient
      .cursorList({ search: trimmed, is_active: 1, limit: PAGE_LIMIT })
      .then((res) => {
        if (cancelled) return;
        setResults(res.data ?? []);
        setMeta(res.meta ?? undefined);
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err?.message || tCommon("loadError"));
      })
      .finally(() => { if (!cancelled) setSearching(false); });

    return () => { cancelled = true; };
  }, [debouncedKeyword, mode, tCommon]);

  // ─── Load more ────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!meta?.has_more || !meta.next_cursor) return;
    setLoadingMore(true);
    try {
      const res = await clubServiceClient.cursorList({
        search: debouncedKeyword.trim(),
        is_active: 1,
        limit: PAGE_LIMIT,
        cursor: meta.next_cursor,
      });
      setResults((prev) => [...prev, ...(res.data ?? [])]);
      setMeta(res.meta ?? undefined);
    } catch (err: any) {
      toast.error(err?.message || tCommon("loadError"));
    } finally {
      setLoadingMore(false);
    }
  }, [meta, debouncedKeyword, tCommon]);

  // ─── Join by slug ─────────────────────────────────────────────────────────
  const handleJoinBySlug = async (club: Club) => {
    const slug = getTranslatedSlug(club.translations, locale);
    if (!slug) { toast.error(tCommon("loadError")); return; }
    setJoinClubSlug(slug);
    try {
      const res = await clubServiceClient.join({ club_slug: slug, join_type: "request" });
      if (res.success) {
        const name = getTranslation(club.translations, locale)?.name ?? "";
        setJoinSuccess({ name, message: res.message || t("joinSuccessDefault") });
      } else {
        toast.error(res.message || t("joinFailed"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("joinFailed"));
    } finally {
      setJoinClubSlug(null);
    }
  };

  // ─── Join by token ────────────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  const handleJoinByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setTokenSubmitting(true);
    try {
      const res = await clubServiceClient.join({ invite_code: token.trim(), join_type: "invite" });
      if (res.success) {
        toast.success(t("tokenAccepted"));
        router.push("/");
        router.refresh();
      } else {
        toast.error(res.message || t("tokenInvalid"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("tokenInvalid"));
    } finally {
      setTokenSubmitting(false);
    }
  };

  const trimmed = debouncedKeyword.trim();
  const showHintShort = keyword.trim().length > 0 && keyword.trim().length < MIN_SEARCH_LENGTH;
  const showEmpty = results.length === 0 && trimmed.length >= MIN_SEARCH_LENGTH && !searching;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">

      <Breadcrumb navItems={[]} homeHref="/" extraItems={[{ label: t("breadcrumb") }]} />

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background-muted px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Users className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-foreground-muted">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Tab switcher — sliding pill, không remount content ───────────── */}
      <div
        className="relative grid grid-cols-2 rounded-xl bg-background-muted p-1"
        role="tablist"
        aria-label={t("breadcrumb")}
      >
        {/* Animated sliding background */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)]",
            "bg-background rounded-lg",
            "shadow-sm ring-1 ring-foreground/10",
            "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mode === "token" && "translate-x-[calc(100%+4px)]"
          )}
        />
        {(["search", "token"] as Mode[]).map((m) => {
          const isActive = mode === m;
          const Icon = m === "search" ? Search : Ticket;
          const label = m === "search" ? t("searchTab") : t("tokenTab");
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${m}-panel`}
              key={m}
              onClick={() => { setMode(m); setJoinSuccess(null); }}
              className={cn(
                "relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2.5 sm:px-3",
                "text-sm font-medium transition-colors duration-200",
                isActive
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content — cả 2 luôn mount, dùng opacity+translate để switch ─
           Active  → relative  (chiếm không gian, container cao theo nó)
           Inactive → absolute (không chiếm không gian, không gây layout jump) */}
      <div className="relative">

        {/* Search panel */}
        <div className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          mode === "search"
            ? "relative opacity-100 translate-y-0"
            : "absolute inset-x-0 top-0 opacity-0 -translate-y-2 pointer-events-none select-none"
        )} id="search-panel" role="tabpanel" aria-hidden={mode !== "search"}>
          {joinSuccess ? (
            <div className="rounded-2xl p-6">
              <JoinSuccess
                clubName={joinSuccess.name}
                message={joinSuccess.message}
                onDismiss={() => setJoinSuccess(null)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search input */}
              <div className="group relative">
                <label htmlFor="club-search" className="sr-only">
                  {t("searchPlaceholder")}
                </label>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted z-10 transition-colors group-focus-within:text-primary" />
                <input
                  id="club-search"
                  name="club-search"
                  type="text"
                  autoComplete="off"
                  placeholder={t("searchPlaceholder")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className={cn(
                    "h-11 w-full rounded-xl border bg-background",
                    "pl-10 pr-10 text-sm text-foreground",
                    "placeholder:text-foreground-muted",
                    "border-border",
                    "focus:border-primary",
                    "focus:outline-none focus:ring-4 focus:ring-primary/10",
                    "shadow-sm transition-all duration-200"
                  )}
                />
                {searching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary z-10" />
                )}
              </div>

              {/* Min length hint — fixed height tránh nhảy layout */}
              <div className="min-h-5" aria-live="polite">
                {showHintShort && (
                  <p className="text-xs text-center text-foreground-muted">
                    {t("searchMinLength", { min: String(MIN_SEARCH_LENGTH) })}
                  </p>
                )}
              </div>

              {/* Results */}
              <div className="min-h-64 space-y-3 sm:min-h-80" aria-live="polite" aria-busy={searching}>
                {searching ? (
                  <>
                    <ClubRowSkeleton />
                    <ClubRowSkeleton />
                    <ClubRowSkeleton />
                  </>
                ) : showEmpty ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-muted/50 px-4 py-12 text-center sm:py-16">
                    <div className="w-10 h-10 rounded-full bg-background-muted flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-foreground-muted" />
                    </div>
                    <p className="text-sm font-medium text-foreground-muted">
                      {t("noResults")}
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">
                      {t("searchHint")}
                    </p>
                  </div>
                ) : (
                  results.map((club) => {
                    const slug = getTranslatedSlug(club.translations, locale);
                    const tr = getTranslation(club.translations, locale);
                    const name = tr?.name ?? `#${club.id}`;
                    const desc = tr?.description;
                    const isJoining = joinClubSlug === slug;
                    return (
                      <div
                        key={club.id}
                        className={cn(
                          "group flex flex-col items-stretch gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4",
                          "bg-background",
                          "border border-border",
                          "shadow-sm ring-1 ring-foreground/5",
                          "hover:border-primary/40",
                          "hover:shadow-md hover:-translate-y-0.5",
                          "transition-all duration-200"
                        )}
                      >
                        {/* Logo */}
                        <div className="flex min-w-0 items-center gap-3 sm:contents">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background-muted ring-1 ring-foreground/10">
                          <CustomImage
                            src={club.logo}
                            alt={name}
                            className="w-full h-full object-cover"
                            fallback={
                              <span className="text-sm font-bold text-foreground-muted uppercase">
                                {name.slice(0, 2)}
                              </span>
                            }
                            fallbackClassName="w-full h-full flex items-center justify-center"
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="font-semibold text-sm text-foreground truncate leading-snug">
                            {name}
                          </p>
                          {desc ? (
                            <p className="text-xs text-foreground-muted truncate">
                              {desc}
                            </p>
                          ) : (
                            <p className="text-xs text-foreground-muted italic">
                              {tCommon("noDescription")}
                            </p>
                          )}
                          {club.total_members != null && (
                            <div className="flex items-center gap-1 pt-0.5">
                              <Users className="w-3 h-3 text-foreground-muted" />
                              <span className="text-[11px] text-foreground-muted">
                                {club.total_members} {tCommon("members")}
                              </span>
                            </div>
                          )}
                        </div>
                        </div>

                        {/* Join */}
                        <button
                          disabled={isJoining}
                          onClick={() => handleJoinBySlug(club)}
                          className={cn(
                            "flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 sm:w-auto",
                            "text-sm font-medium",
                            "border border-primary/40",
                            "text-primary",
                            "bg-primary/10",
                            "hover:bg-primary/15",
                            "hover:border-primary/50",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "transition-all duration-150"
                          )}
                        >
                          {isJoining ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              {t("join")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {!searching && (
                <CursorLoadMore
                  meta={meta}
                  totalLoaded={results.length}
                  onLoadMore={handleLoadMore}
                  loading={loadingMore}
                />
              )}

              {results.length > 0 && (
                <p className="text-xs text-center text-foreground-muted">
                  {t("searchHint")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Token panel */}
        <div className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          mode === "token"
            ? "relative opacity-100 translate-y-0"
            : "absolute inset-x-0 top-0 opacity-0 translate-y-2 pointer-events-none select-none"
        )} id="token-panel" role="tabpanel" aria-hidden={mode !== "token"}>
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-sm ring-1 ring-foreground/5">
            {/* Panel header */}
            <div className="flex items-start gap-3 border-b border-border bg-amber-50/60 px-4 py-4 dark:bg-amber-950/20 sm:items-center sm:px-6 sm:py-5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Ticket className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("tokenLabel")}
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("tokenHint")}
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinByToken} className="space-y-4 p-4 sm:p-6">
              <label htmlFor="invite-code" className="sr-only">
                {t("tokenLabel")}
              </label>
              <input
                id="invite-code"
                name="invite-code"
                type="text"
                autoComplete="off"
                placeholder={t("tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-xl border bg-background-muted",
                  "px-4 text-sm text-foreground",
                  "placeholder:text-foreground-muted",
                  "border-border",
                  "focus:border-amber-400 dark:focus:border-amber-500",
                  "focus:bg-background",
                  "focus:outline-none focus:ring-4 focus:ring-amber-500/10",
                  "font-mono tracking-widest transition-all duration-200"
                )}
              />

              <button
                type="submit"
                disabled={tokenSubmitting || !token.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-11 rounded-xl",
                  "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
                  "text-white text-sm font-semibold",
                  "shadow-sm shadow-amber-500/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150"
                )}
              >
                {tokenSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("tokenSubmit")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
