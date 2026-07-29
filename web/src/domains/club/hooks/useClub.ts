"use client";

import { useLayoutEffect, useRef } from "react";
import { useClubStore } from "../stores/clubStore";
import type { Club } from "../types";

/**
 * useClub — đọc club workspace hiện tại từ store.
 */
export function useClub() {
  const club = useClubStore((s) => s.club);
  return { club };
}

/**
 * Hydrate club store từ club do Server Component fetch.
 *
 * Chạy trong useLayoutEffect để tránh cảnh báo "Cannot update a component
 * while rendering another" và không bị flash club=null khi paint.
 */
export function useHydrateClub(club: Club | null) {
  const hasHydrated = useRef(false);

  if (!hasHydrated.current) {
    hasHydrated.current = true;
    if (club) {
      useClubStore.getState().setClub(club);
    } else {
      useClubStore.getState().reset();
    }
  }
}
