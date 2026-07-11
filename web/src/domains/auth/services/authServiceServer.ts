import "server-only";
import { BaseService } from "@/lib/baseService";
import type { ApiResponse } from "@/types/api";
import type { Profile } from "../types";

/**
 * Auth service — SERVER-ONLY.
 *
 * Used by Server Components (e.g. dashboard layout) to fetch profile.
 * Login/register/refresh/logout go through Route Handlers via authService (client-safe).
 */
class AuthServiceServer extends BaseService<Profile> {
  protected resource = "auth";

  /** GET /auth/profile — current user profile. */
  getProfile(): Promise<ApiResponse<Profile>> {
    return this.get<ApiResponse<Profile>>("/auth/profile");
  }
}

export const authServiceServer = new AuthServiceServer();
