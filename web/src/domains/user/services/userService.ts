import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { User, UserListParams } from "../types";

class UserService extends BaseRepository<User> {
  protected resource = "users";
  protected adapter = browserAdapter;


  /** GET /users/active — active + verified users (paginated). */
  listActive(params?: Omit<UserListParams, "status" | "email_verified_at">) {
    return this.get<PaginatedResponse<User>>("/users/active", params);
  }
}

export const userService = new UserService();
