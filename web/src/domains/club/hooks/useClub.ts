"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (club) {
      useClubStore.getState().setClub(club);
    } else {
      useClubStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // club từ SSR — stable, chỉ mount 1 lần
}
