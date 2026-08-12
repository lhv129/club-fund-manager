"use client";
import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { PlayingSchedule } from "../types";
import type { ApiResponse } from "@/types/api";

class PlayingScheduleService extends BaseRepository<PlayingSchedule> {
    protected resource = "playing-schedules";
    protected adapter = browserAdapter;
    toggleStatus(id: number, data?: Record<string, unknown>) { return this.adapter.patch<ApiResponse<PlayingSchedule>>(`/${this.resource}/${id}/toggle-status`, data); }
}
export const playingScheduleService = new PlayingScheduleService();
export const getPlayingScheduleService = (_clubSlug?: string) => playingScheduleService;
