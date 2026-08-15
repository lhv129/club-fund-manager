"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { WebhookConfig } from "../types";

class WebhookConfigService extends BaseRepository<WebhookConfig> {
    protected resource = "webhook-configs";
    protected adapter = browserAdapter;

    override show(id: number | string, clubSlug?: string) {
        return this.get<ApiResponse<WebhookConfig>>(`/${this.resource}/${id}`, {
            ...(clubSlug ? { club_slug: clubSlug } : {}),
        });
    }

    toggleStatus(id: number | string, params?: Record<string, unknown>) {
        return this.patch<ApiResponse<WebhookConfig>>(
            `/${this.resource}/${id}/toggle-status`,
            params,
        );
    }
}

export const webhookConfigService = new WebhookConfigService();
export const getWebhookConfigService = (_clubSlug?: string) => webhookConfigService;
