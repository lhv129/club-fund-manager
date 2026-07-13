"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Search, Ticket, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import CustomImage from "@/components/CustomImage";
import { clubServiceClient } from "@/domains/club/services/clubService";
import { clubDashboardRoute } from "@/constants";
import type { Club, Translation } from "@/domains/club/types";
import type { ApiResponse } from "@/types/api";

type Mode = "search" | "token";

export function NoClubClient() {
  const t = useTranslations("noClub");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("search");

  // ─── Search mode ──────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Club[]>([]);
  const [searching, setSearching] = useState(false);
  const [joinClubId, setJoinClubId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tr = (translations?: Translation[]) =>
    translations?.find((item) => item.locale === locale) ?? translations?.[0];

  const slugOf = (club: Club): string | undefined =>
    tr(club.translations)?.slug ?? club.translations?.[0]?.slug;

  // Debounce search 400ms
  useEffect(() => {
    if (mode !== "search") return;
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await clubServiceClient.list({
          search: keyword.trim(),
          is_active: 1,
          limit: 10,
        });
        setResults(res.data ?? []);
      } catch (error: any) {
        toast.error(error?.message || tCommon("loadError"));
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, mode, tCommon]);

  // ─── Join by club_id (search mode) ───────────────────────────────────────
  const handleJoinById = async (club: Club) => {
    setJoinClubId(club.id);
    try {
      const res = await clubServiceClient.join({
        club_id: club.id,
        join_type: "request",
      });
      if (res.success) {
        toast.success(t("joinRequested", { name: tr(club.translations)?.name ?? "" }));
        // Không tự vào workspace — chờ dashboard duyệt (status = pending)
      } else {
        toast.error(res.message || t("joinFailed"));
      }
    } catch (error: any) {
      toast.error(error?.message || t("joinFailed"));
    } finally {
      setJoinClubId(null);
    }
  };

  // ─── Join by invite token ────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  const handleJoinByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setTokenSubmitting(true);
    try {
      const res = await clubServiceClient.join({
        token: token.trim(),
        join_type: "invite",
      });
      if (res.success) {
        toast.success(t("tokenAccepted"));
        // Nếu BE trả về club → vào workspace luôn (invite thường auto-approve)
        const member = res.data;
        if (member?.club_id) {
          // Cần fetch club để lấy slug — hoặc BE trả kèm. Fallback: refresh để
          // LoginForm-redirect logic chạy lại. Đơn giản: push về /dashboard/clubs.
          router.push("/dashboard/clubs");
          router.refresh();
        } else {
          router.push("/dashboard/clubs");
          router.refresh();
        }
      } else {
        toast.error(res.message || t("tokenInvalid"));
      }
    } catch (error: any) {
      toast.error(error?.message || t("tokenInvalid"));
    } finally {
      setTokenSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-gray-800">
        <button
          onClick={() => setMode("search")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "search"
              ? "bg-white dark:bg-gray-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-gray-400 hover:text-zinc-700"
          }`}
        >
          <Search className="h-4 w-4" />
          {t("searchTab")}
        </button>
        <button
          onClick={() => setMode("token")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "token"
              ? "bg-white dark:bg-gray-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-gray-400 hover:text-zinc-700"
          }`}
        >
          <Ticket className="h-4 w-4" />
          {t("tokenTab")}
        </button>
      </div>

      {/* ─── Search mode ─────────────────────────────────────────────────── */}
      {mode === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white dark:bg-gray-900 pl-10 pr-10 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400 z-10" />
            )}
          </div>

          {results.length === 0 && keyword.trim() && !searching && (
            <Card>
              <p className="text-center text-sm text-zinc-400 py-8">
                {t("noResults")}
              </p>
            </Card>
          )}

          <div className="space-y-2">
            {results.map((club) => {
              const name = tr(club.translations)?.name ?? `#${club.id}`;
              const desc = tr(club.translations)?.description;
              const isJoining = joinClubId === club.id;
              return (
                <Card key={club.id}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <CustomImage
                        src={club.logo}
                        alt={name}
                        className="w-full h-full object-cover"
                        fallback={<span className="text-xs text-zinc-400">CLB</span>}
                        fallbackClassName="w-full h-full flex items-center justify-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white truncate">
                        {name}
                      </p>
                      {desc && (
                        <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">
                          {desc}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isJoining}
                      onClick={() => handleJoinById(club)}
                      className="shrink-0"
                    >
                      {isJoining ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {t("join")}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-center text-zinc-400">
            {t("searchHint")}
          </p>
        </div>
      )}

      {/* ─── Token mode ──────────────────────────────────────────────────── */}
      {mode === "token" && (
        <form onSubmit={handleJoinByToken} className="space-y-4">
          <Card className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-gray-300 mb-1.5">
                {t("tokenLabel")}
              </label>
              <input
                type="text"
                placeholder={t("tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white dark:bg-gray-900 px-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400">
              {t("tokenHint")}
            </p>
            <Button type="submit" disabled={tokenSubmitting} className="w-full">
              {tokenSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("tokenSubmit")
              )}
            </Button>
          </Card>
        </form>
      )}
    </div>
  );
}
