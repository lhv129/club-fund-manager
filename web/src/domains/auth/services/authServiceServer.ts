import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { ApiResponse } from "@/types/api";
import type { Profile } from "../types";

class AuthServiceServer extends BaseRepository<Profile> {
  protected resource = "auth";
  protected adapter = serverAdapter;

  /** GET /auth/profile — current user profile. */
  getProfile(): Promise<ApiResponse<Profile>> {
    return this.get<ApiResponse<Profile>>("/auth/profile");
  }
}

export const authServiceServer = new AuthServiceServer();
