import "server-only";
import { BaseRepository } from "@/lib/baseRepository";
import { serverAdapter } from "@/lib/http/serverAdapter";
import type { Club } from "../types";

/**
 * ClubServiceServer — server-only service cho Club.
 *
 * Dùng trong Server Component (club/[slug]/layout.tsx) để fetch club theo slug
 * mà không cần qua /api/proxy.
 */
class ClubServiceServer extends BaseRepository<Club> {
  protected resource = "clubs";
  protected adapter = serverAdapter;
}

export const clubServiceServer = new ClubServiceServer();
