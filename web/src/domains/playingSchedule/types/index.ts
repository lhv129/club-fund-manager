import type { Translation } from "@/domains/club/types";

export interface PlayingScheduleTranslation extends Translation {
    title?: string;
    note?: string | null;
}

export interface PlayingSchedule {
    id: number;
    club_id: number;
    weekday: number;
    court_name: string;
    court_address: string | null;
    start_time: string;
    end_time: string;
    auto_generate: boolean;
    weeks_ahead: number | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    sort_order: number;
    translations?: PlayingScheduleTranslation[];
    created_at: string | null;
    updated_at: string | null;
}

export type PlayingScheduleFilters = {
    search: string;
    weekday?: number;
    is_active: 0 | 1 | undefined;
};
