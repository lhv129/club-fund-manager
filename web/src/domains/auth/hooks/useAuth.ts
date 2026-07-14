"use client";

import { useCallback, useRef, useLayoutEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import {
  can,
  canAccessClub,
  hasAnyClubPermission,
} from "@/lib/permissions";
import type { LoginPayload, RegisterPayload, Profile } from "../types";

/**
 * useAuth — main auth hook for client components.
 *
 * Permission check mirrors backend `User::hasPermission(module, action, clubId)`:
 *   - is_superadmin → bypass all
 *   - else: system scope (clubId null) → flat module key
 *           club scope (clubId number) → nested `club_{id}`
 *
 * Xem docs/permission-guide.md §4-§5.
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    reset,
  } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const profile = await authService.login(payload);
        setUser(profile);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser],
  );

  const register = useCallback(
    async (
      payload: RegisterPayload,
    ): Promise<{ success: boolean; message: string }> => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.register(payload);
        return { success: response.success, message: response.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      reset();
    }
  }, [reset]);

  /**
   * Check permission — mirror backend hasPermission(module, action, clubId).
   *
   * @param module  module slug (e.g. 'club', 'user', 'member')
   * @param action  action (e.g. 'view', 'create', 'update', 'delete')
   * @param clubId  undefined/null → SYSTEM SCOPE; number → CLUB SCOPE
   */
  const hasPermission = useCallback(
    (module: string, action: string, clubId?: number | null): boolean => {
      if (!user) return false;
      return can(user.permissions, user.is_superadmin, module, action, clubId);
    },
    [user],
  );

  /** Check user có truy cập club workspace này không (club layout guard). */
  const checkClubAccess = useCallback(
    (clubId: number): boolean =>
      user ? canAccessClub(user.permissions, user.is_superadmin, clubId) : false,
    [user],
  );

  /** Check user có quyền ở bất kỳ club nào (cho nút "← Quay lại CLB"). */
  const checkAnyClubPermission = useCallback(
    (): boolean =>
      user ? hasAnyClubPermission(user.permissions, user.is_superadmin) : false,
    [user],
  );

  const isSuperAdmin = user?.is_superadmin ?? false;
  const isSystemAdmin = user?.is_system_admin ?? false;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isSuperAdmin,
    isSystemAdmin,
    login,
    register,
    logout,
    hasPermission,
    canAccessClub: checkClubAccess,
    hasAnyClubPermission: checkAnyClubPermission,
    clearError: () => setError(null),
  };
}

/**
 * Hydrate auth store from a server-fetched profile.
 *
 * Chạy trong useLayoutEffect (không phải trong thân render) để:
 *  - Không còn cảnh báo "Cannot update a component while rendering another".
 *  - Vẫn không bị flash user=null, vì useLayoutEffect chạy trước khi
 *    browser paint — tất cả component subscribe store re-render xong
 *    rồi mới vẽ lên màn hình.
 */
export function useHydrateAuth(profile: Profile | null) {
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const hydratedRef = useRef(false);
  useLayoutEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (profile) {
      setUser(profile);
    } else {
      reset();
    }
  }, [profile, setUser, reset]);

}
