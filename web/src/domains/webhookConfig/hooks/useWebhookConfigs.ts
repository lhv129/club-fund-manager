"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { getWebhookConfigService } from "@/domains/webhookConfig/services/webhookConfigService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { useListParams } from "@/hooks/useListParams";
import type { ServerErrorResponse, SubmitResult } from "@/components/shared/forms/FormModal";
import type { WebhookConfig, WebhookConfigFilters, WebhookConfigFormValues } from "../types";

function serverError(error: unknown): ServerErrorResponse | null {
    const response = (error as { response?: { data?: ServerErrorResponse } })?.response?.data;
    if (response) return response;
    if (error && typeof error === "object" && "success" in error && (error as ServerErrorResponse).success === false) {
        return error as ServerErrorResponse;
    }
    return null;
}

function buildPayload(values: WebhookConfigFormValues): FormData {
    const payload = new FormData();
    if (values.club_slug) payload.append("club_slug", values.club_slug);
    payload.append("bank_account_id", values.bank_account_id ?? "");
    payload.append("type", values.type ?? "sepay");
    // API deliberately never returns the secret, but create/update must still
    // carry the field (an empty value also allows the backend to clear it).
    payload.append("webhook_secret", values.webhook_secret ?? "");
    return payload;
}

export function useWebhookConfigs(
    params: ReturnType<typeof useListParams<WebhookConfigFilters>>["params"],
) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const clubSlug = params.club_slug as string | undefined;
    const service = getWebhookConfigService(clubSlug);
    const queryKey = ["webhook-configs", params] as const;

    const query = useQuery<PaginatedResponse<WebhookConfig>>({
        queryKey,
        queryFn: () => service.list(params),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["webhook-configs"] });
    const createMutation = useMutation({
        mutationFn: (values: WebhookConfigFormValues) => {
            const payload = buildPayload(values);
            if (clubSlug) payload.set("club_slug", clubSlug);
            return service.create(payload);
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, values }: { id: number; values: WebhookConfigFormValues }) => {
            const payload = buildPayload(values);
            if (clubSlug) payload.set("club_slug", clubSlug);
            return service.update(id, payload);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.destroy(id, clubSlug ? { club_slug: clubSlug } : undefined),
        onSuccess: async (result) => {
            const response = result as ApiResponse<unknown>;
            if (response.success) {
                await invalidate();
                toast.success(response.message || t("deleteSuccess"));
            }
        },
        onError: (error) => toast.error((error as Error)?.message || t("deleteError")),
    });
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => service.toggleStatus(
            id,
            clubSlug ? { club_slug: clubSlug } : undefined,
        ),
        onSuccess: async (response) => {
            if (!response.success) {
                toast.error(response.message || t("updateError"));
                return;
            }
            await invalidate();
            toast.success(response.message || t("updateSuccess"));
        },
        onError: (error) => toast.error((error as Error)?.message || t("updateError")),
    });

    const submit = async (
        mutate: (values: WebhookConfigFormValues) => Promise<unknown>,
        values: WebhookConfigFormValues,
    ): Promise<SubmitResult> => {
        try {
            const response = await mutate(values) as ApiResponse<WebhookConfig>;
            if (!response.success) return { success: false, message: response.message, errors: response.errors };
            await invalidate();
            toast.success(response.message || t("saveSuccess"));
            return;
        } catch (error) {
            return serverError(error) || { success: false, message: (error as Error)?.message };
        }
    };

    return {
        data: query.data?.data ?? [], total: query.data?.meta?.total ?? 0,
        isLoading: query.isLoading, isFetching: query.isFetching,
        isCreating: createMutation.isPending, isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending, isTogglingStatus: toggleStatusMutation.isPending,
        handleCreate: (values: Record<string, string>) => submit(createMutation.mutateAsync, values as WebhookConfigFormValues),
        handleEdit: (id: number, values: Record<string, string>) => submit(
            (nextValues) => updateMutation.mutateAsync({ id, values: nextValues }),
            values as WebhookConfigFormValues,
        ),
        handleDeleteConfirm: (id: number) => deleteMutation.mutate(id),
        handleToggleStatus: (id: number) => toggleStatusMutation.mutate(id),
    };
}

export function useWebhookConfig(id: number, clubSlug?: string) {
    return useQuery({
        queryKey: ["webhook-config", clubSlug, id],
        queryFn: () => getWebhookConfigService(clubSlug).show(id, clubSlug),
        enabled: Boolean(id),
    });
}
