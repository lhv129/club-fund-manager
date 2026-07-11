/** Club domain types — mirror ClubResource, ClubMemberResource, ClubInviteResource. */

/** Translation entry — shared shape across all translatable entities. */
export interface Translation {
  locale: string;
  name: string;
  slug?: string;
  description?: string | null;
}

/** Club — matches ClubResource. */
export interface Club {
  id: number;
  max_members: number | null;
  logo: string | null;
  is_active: boolean;
  sort_order: number;
  total_members?: number | null;
  translations?: Translation[];
  created_at: string | null;
  updated_at: string | null;
}

/** ClubMember — matches ClubMemberResource. */
export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  join_type: "request" | "invite";
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  joined_at: string | null;
  rejected_reason: string | null;
  user?: { id: number; name: string; email: string } | null;
  reviewer?: { id: number; name: string } | null;
  invite?: { id: number; token: string } | null;
  roles?: Array<{ id: number; slug: string; translations: unknown[] }>;
  created_at: string | null;
  reviewed_at: string | null;
}

/** ClubInvite — matches ClubInviteResource. */
export interface ClubInvite {
  id: number;
  club_id: number;
  token: string;
  join_url: string;
  expires_at: string | null;
  used_count: number;
  sort_order: number;
  is_active: boolean;
  is_expired: boolean;
  created_by?: { id: number; name: string } | null;
  created_at: string | null;
}

/** Club list filter params. */
export interface ClubListParams {
  search?: string;
  is_active?: 0 | 1;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
}
