"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { User } from "../types";
import type { ApiResponse } from "@/types/api";


class UserServiceClient extends BaseRepository<User> {
  protected resource = "users";
  protected adapter = browserAdapter;

  updateStatus(
    id: number,
    status: "active" | "inactive" | "locked"
  ): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>(
      `/${this.resource}/${id}/status`,
      { status }
    );
  }

}

export const userServiceClient = new UserServiceClient();