/** User domain types — mirror UserResource. */

export interface User {
  id: number;
  fullname: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
}

/** User status — matches backend User model constants. */
export type UserStatus = "pending" | "active" | "locked";

/** Params for user list filtering. */
export interface UserListParams {
  search?: string;
  status?: UserStatus;
  email_verified_at?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
