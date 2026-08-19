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
    protected resource = "exchange-sessions/players";

    constructor(sessionId?: number) {
        super();
        this.sessionId = sessionId;
    }

    private sessionId?: number;

    override list(params?: ListParams) {
        return this.get<PaginatedResponse<ExchangeSessionPlayer>>(
            `/${this.resource}`,
            this.sessionId === undefined
                ? params
                : { ...params, exchange_session_id: this.sessionId }
        );
    }

    togglePaid(id: number, sessionId: number, data?: Record<string, unknown>) {
        return this.put<ApiResponse<ExchangeSessionPlayer>>(
            `/exchange-sessions/${sessionId}/players/${id}/toggle-paid`,
            data
        );
    }
}

export const exchangeSessionService = new ExchangeSessionService();

export function getExchangeSessionPlayerService(sessionId?: number) {
    return new ExchangeSessionPlayerService(sessionId);
}
