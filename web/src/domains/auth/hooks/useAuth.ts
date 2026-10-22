"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import {
  can,
  canAccessClub,
  hasAnyClubPermission,
  clubPermissionCount,
} from "@/lib/permissions";
import type {
  LoginPayload,
  RegisterPayload,
  Profile,
  ClubRole,
} from "../types";

/**
 * useAuth — main auth hook for client components.
 *
 * Permission / role model:
 *
 * Global scope:
 *   user.is_superadmin
 *   user.is_system_admin
 *   user.roles.global
 *
 * Club scope:
 *   user.roles.club_{clubId}
 *
 * Example:
 *
 * roles: {
 *   global: {
 *     id: 2,
 *     slug: "system_admin",
 *     name: "System Administrator"
 *   },
 *   club_5: {
 *     id: 8,
 *     slug: "manager",
 *     name: "Manager"
 *   }
 * }
 *
 * Important:
 * - Global role and Club role are two different scopes.
 * - getClubRole() only returns the role for the requested Club.
 * - Global role does NOT become a Club role.
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

  /* ---------------------------------------------------------------- */
  /* Auth actions */
  /* ---------------------------------------------------------------- */

  const login = useCallback(
    async (payload: LoginPayload): Promise<Profile | null> => {
      setLoading(true);
      setError(null);

      try {
        const profile = await authService.login(payload);

        setUser(profile);

        return profile;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Login failed";

        setError(message);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser],
  );

  const register = useCallback(
    async (
      payload: RegisterPayload,
    ): Promise<{
      success: boolean;
      message: string | undefined;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.register(payload);

        return {
          success: response.success,
          message: response.message,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Registration failed";

        setError(message);

        return {
          success: false,
          message,
        };
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

  /* ---------------------------------------------------------------- */
  /* Global role */
  /* ---------------------------------------------------------------- */

  /**
   * Superadmin is a global role with full authorization bypass.
   */
  const isSuperAdmin = user?.is_superadmin ?? false;

  /**
   * System admin is a global role.
   *
   * Do NOT infer this from permissions.
   * Backend already provides the authoritative flag.
   */
  const isSystemAdmin = user?.is_system_admin ?? false;

  /**
   * Get the global/system role.
   *
   * Example:
   *
   * {
   *   id: 2,
   *   slug: "system_admin",
   *   name: "System Administrator"
   * }
   */
  const getGlobalRole = useCallback(() => {
    if (!user || !user.roles) {
      return null;
    }

    if (Array.isArray(user.roles)) {
      return null;
    }

    return user.roles.global ?? null;
  }, [user]);

  /* ---------------------------------------------------------------- */
  /* Permission */
  /* ---------------------------------------------------------------- */

  /**
   * Check permission.
   *
   * Mirrors backend:
   *
   * User::hasPermission(module, action, clubId)
   *
   * clubId:
   *   null / undefined → global/system scope
   *   number           → club scope
   */
  const hasPermission = useCallback(
    (
      module: string,
      action: string,
      clubId?: number | null,
    ): boolean => {
      if (!user) {
        return false;
      }

      // Global roles have full permission.
      if (
        user.is_superadmin ||
        user.is_system_admin
      ) {
        return true;
      }

      return can(
        user.permissions,
        false,
        module,
        action,
        clubId,
      );
    },
    [user],
  );

  /* ---------------------------------------------------------------- */
  /* Club access */
  /* ---------------------------------------------------------------- */

  const hasMultipleClubs =
    clubPermissionCount(user?.permissions) > 1;

  /**
   * Check whether the user can access a Club workspace.
   */
  const checkClubAccess = useCallback(
    (clubId: number): boolean =>
      user
        ? canAccessClub(
          user.permissions,
          user.is_superadmin,
          clubId,
        )
        : false,
    [user],
  );

  /**
   * Check whether the user has permission in at least one Club.
   */
  const checkAnyClubPermission = useCallback(
    (): boolean =>
      user
        ? hasAnyClubPermission(
          user.permissions,
          user.is_superadmin,
        )
        : false,
    [user],
  );

  /* ---------------------------------------------------------------- */
  /* Club roles */
  /* ---------------------------------------------------------------- */

  /**
   * Get the user's role in a specific Club.
   *
   * IMPORTANT:
   *
   * This only reads:
   *
   *   roles.club_{clubId}
   *
   * It does NOT return roles.global.
   *
   * Example:
   *
   * roles: {
   *   global: {
   *     id: 2,
   *     slug: "system_admin",
   *     name: "System Administrator"
   *   },
   *   club_5: {
   *     id: 8,
   *     slug: "manager",
   *     name: "Manager"
   *   }
   * }
   *
   * getClubRole(5)
   * → {
   *     id: 8,
   *     slug: "manager",
   *     name: "Manager"
   *   }
   */
  const getClubRole = useCallback(
    (clubId?: number | null): ClubRole | null => {
      if (!user || clubId == null) {
        return null;
      }

      if (!user.roles || Array.isArray(user.roles)) {
        return null;
      }

      return user.roles[`club_${clubId}`] ?? null;
    },
    [user],
  );

  /**
   * Check whether the user has a specific role in a Club.
   *
   * Example:
   *
   * hasClubRole(5, "manager")
   */
  const hasClubRole = useCallback(
    (
      clubId: number | null | undefined,
      roleSlug: string,
    ): boolean => {
      return getClubRole(clubId)?.slug === roleSlug;
    },
    [getClubRole],
  );

  /**
   * Check whether the user has a specific global role.
   *
   * Example:
   *
   * hasGlobalRole("system_admin")
   * hasGlobalRole("superadmin")
   */
  const hasGlobalRole = useCallback(
    (roleSlug: string): boolean => {
      return getGlobalRole()?.slug === roleSlug;
    },
    [getGlobalRole],
  );

  /* ---------------------------------------------------------------- */
  /* Return */
  /* ---------------------------------------------------------------- */

  return {
    user,

    isAuthenticated,
    isLoading,
    error,

    // Global role state
    isSuperAdmin,
    isSystemAdmin,

    // Auth actions
    login,
    register,
    logout,

    // Permissions
    hasPermission,

    // Club access
    canAccessClub: checkClubAccess,
    hasAnyClubPermission: checkAnyClubPermission,
    hasMultipleClubs,

    // Global role
    getGlobalRole,
    hasGlobalRole,

    // Club role
    getClubRole,
    hasClubRole,

    // Error
    clearError: () => setError(null),
  };
}

/**
 * Hydrate auth store from a server-fetched profile.
 *
 * Chạy trong useEffect để:
 * - Không update Zustand store trong render.
 * - Hydrate auth state sau khi profile được load.
 */
export function useHydrateAuth(profile: Profile | null) {
  useEffect(() => {
    if (profile) {
      useAuthStore.getState().setUser(profile);
    } else {
      useAuthStore.getState().reset();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}