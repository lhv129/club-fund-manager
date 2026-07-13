import { create } from "zustand";
import type { Club } from "../types";

/**
 * Club store (zustand) — club workspace hiện tại.
 *
 * Server Component (`club/[slug]/layout.tsx`) fetch club theo slug rồi
 * hydrate store này qua `useHydrateClub`. Các client component
 * (ClubSidebar, LocaleSwitcher, ...) đọc store để đổi slug khi switch locale.
 */
interface ClubState {
  club: Club | null;
  setClub: (club: Club | null) => void;
  reset: () => void;
}

export const useClubStore = create<ClubState>((set) => ({
  club: null,
  setClub: (club) => set({ club }),
  reset: () => set({ club: null }),
}));
