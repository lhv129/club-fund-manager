export type UserStatus = "active" | "inactive" | "banned";

export type UserGender = "male" | "female" | "other";

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  fullname: string;
  username: string;
  email: string;
  address: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: UserGender;
  avatar: string | null;
  email_verified_at: string | null;
  status: UserStatus;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

/** Dùng type (không dùng interface) để thoả Record<string, FilterValue> trong useListParams. */
export type UserFilters = {
  search: string;
  status: UserStatus | undefined;
  email_verified_at: 0 | 1 | undefined; // 1 = đã xác thực, 0 = chưa xác thực
};