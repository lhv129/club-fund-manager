// src/domains/club/hooks/useClub.ts
"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useClubStore } from "../stores/clubStore";
import type { Club } from "../types";

export function useClub() {
  const club = useClubStore((s) => s.club);
  const locale = useLocale();

  // Slug theo locale hiện tại, fallback sang bản đầu tiên
  const slug =
    club?.translations?.find((t) => t.locale === locale)?.slug ??
    club?.translations?.[0]?.slug ??
    null;

  return { club, slug };
}

export function useHydrateClub(club: Club | null) {
  useEffect(() => {
    if (club) {
      useClubStore.getState().setClub(club);
    } else {
      useClubStore.getState().reset();
    }
  }, []);
}