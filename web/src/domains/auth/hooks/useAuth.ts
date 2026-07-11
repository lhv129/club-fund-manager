"use client";

import { useCallback, useRef, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import type { LoginPayload, RegisterPayload, Profile } from "../types";

/**
 * useAuth — main auth hook for client components.
 *
 * Permission check mirrors backend User::hasPermission():
 *   - is_superadmin → bypass all
 *   - else: check permissions[clubId]?.[module]?.includes(action)
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
   * Check permission — mirrors backend hasPermission(module, action, clubId).
   *
   * @param module  module slug (e.g. 'club', 'user')
   * @param action  action (e.g. 'view', 'create', 'update', 'delete')
   * @param clubId  club context (optional — if null, checks any club)
   */
  const hasPermission = useCallback(
    (module: string, action: string, clubId?: number): boolean => {
      if (!user) return false;

      // Superadmin bypass
      if (user.is_superadmin) return true;
      if (
        Array.isArray(user.permissions) &&
        user.permissions.includes("*")
      ) {
        return true;
      }

      const permissions = user.permissions as Record<
        string,
        Record<string, string[]>
      >;

      if (clubId !== undefined) {
        // Club-scoped check
        return (
          permissions[String(clubId)]?.[module]?.includes(action) ?? false
        );
      }

      // Check across all clubs
      return Object.values(permissions).some(
        (modules) => modules[module]?.includes(action) ?? false,
      );
    },
    [user],
  );

  const isSuperAdmin = user?.is_superadmin ?? false;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isSuperAdmin,
    login,
    register,
    logout,
    hasPermission,
    clearError: () => setError(null),
  };
}

/**
 * Hydrate auth store from a server-fetched profile — SYNCHRONOUSLY.
 *
 * Sets the profile into zustand store on first render (not in useEffect)
 * to avoid nav flash where user=null on first paint.
 * Uses useState initializer pattern to run exactly once.
 */
export function useHydrateAuth(profile: Profile | null) {
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const [hydrated] = useState(false);

  // useState initializer runs synchronously during first render
  // Empty deps via useRef guard — runs exactly once
  const ref = useRef(false);
  if (!ref.current) {
    ref.current = true;
    if (profile) {
      setUser(profile);
    } else {
      reset();
    }
  }

  return hydrated;
}
