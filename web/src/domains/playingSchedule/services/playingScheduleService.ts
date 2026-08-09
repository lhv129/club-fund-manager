"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { PlayingSchedule } from "../types";
import type { ApiResponse } from "@/types/api";

class PlayingScheduleService extends BaseRepository<PlayingSchedule> {
    protected resource: string;
    protected adapter = browserAdapter;
    constructor(clubSlug: string) { super(); this.resource = `/clubs/${clubSlug}/playing-schedules`; }
    toggleStatus(id: number) { return this.adapter.patch<ApiResponse<PlayingSchedule>>(`${this.resource}/${id}/toggle-status`); }
}
const cache = new Map<string, PlayingScheduleService>();
export function getPlayingScheduleService(slug: string) { if (!cache.has(slug)) cache.set(slug, new PlayingScheduleService(slug)); return cache.get(slug)!; }
