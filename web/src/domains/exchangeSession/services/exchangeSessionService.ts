"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
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

    constructor(sessionId: number) {
        super();
        this.resource = `exchange-sessions/${sessionId}/players`;
    }

    protected resource: string;

    togglePaid(id: number, data?: Record<string, unknown>) {
        return this.put<ApiResponse<ExchangeSessionPlayer>>(
            `/${this.resource}/${id}/toggle-paid`,
            data
        );
    }
}

export const exchangeSessionService = new ExchangeSessionService();

export function getExchangeSessionPlayerService(sessionId: number) {
    return new ExchangeSessionPlayerService(sessionId);
}
