"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse, ListParams, PaginatedResponse } from "@/types/api";
import type { ExchangeSession, ExchangeSessionPlayer } from "../types";

class ExchangeSessionService extends BaseRepository<ExchangeSession> {
    protected resource = "exchange-sessions";
    protected adapter = browserAdapter;

    complete(id: number, data?: Record<string, unknown>) {
        return this.put<ApiResponse<ExchangeSession>>(
            `/${this.resource}/${id}/complete`,
            data
        );
    }
}

class ExchangeSessionPlayerService extends BaseRepository<ExchangeSessionPlayer> {
    protected adapter = browserAdapter;

    constructor(sessionId?: number) {
        super();
        this.resource = sessionId
            ? `exchange-sessions/${sessionId}/players`
            : "exchange-sessions/players";
    }

    protected resource: string;

    override list(params?: ListParams) {
        return this.get<PaginatedResponse<ExchangeSessionPlayer>>(
            "/exchange-sessions/players",
            params
        );
    }

    togglePaid(id: number, data?: Record<string, unknown>) {
        return this.put<ApiResponse<ExchangeSessionPlayer>>(
            `/${this.resource}/${id}/toggle-paid`,
            data
        );
    }
}

export const exchangeSessionService = new ExchangeSessionService();

export function getExchangeSessionPlayerService(sessionId?: number) {
    return new ExchangeSessionPlayerService(sessionId);
}
