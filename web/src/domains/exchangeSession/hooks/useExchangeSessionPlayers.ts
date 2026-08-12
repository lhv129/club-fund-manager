"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { SubmitResult } from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { getExchangePlayerService } from "../services/exchangeSessionService";
import type {
    ExchangeSessionPlayer,
    ExchangeSessionPlayerFilters,
} from "../types";

const makePayload = (values: Record<string, string>) => ({
    user_id: values.user_id ? Number(values.user_id) : null,
    player_name: values.player_name || null,
    male: Number(values.male || 0),
    female: Number(values.female || 0),
});

export function useExchangeSessionPlayers(
    slug: string,
    sessionId: number,
    params: ReturnType<typeof useListParams<ExchangeSessionPlayerFilters>>["params"]
) {
    const service = getExchangePlayerService(slug, sessionId);
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const queryKey = ["exchange-session-players", slug, sessionId, params] as const;

    const query = useQuery({
        queryKey,
        queryFn: () => service.list(params) as Promise<PaginatedResponse<ExchangeSessionPlayer>>,
        enabled: Boolean(slug) && sessionId > 0,
    });

    const createMutation = useMutation({
        mutationFn: (values: Record<string, string>) => service.create(makePayload(values)),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, values }: { id: number; values: Record<string, string> }) =>
            service.update(id, makePayload(values)),
    });
    const deleteMutation = useMutation({ mutationFn: (id: number) => service.destroy(id) });
    const paidMutation = useMutation({
        mutationFn: (id: number) => service.togglePaid(id) as Promise<ApiResponse<ExchangeSessionPlayer>>,
    });

    const updateCachedRow = (id: number, saved?: ExchangeSessionPlayer) => {
        queryClient.setQueryData<PaginatedResponse<ExchangeSessionPlayer>>(queryKey, (old) =>
            old
                ? {
                    ...old,
                    data: (old.data ?? []).map((row) =>
                        row.id === id ? { ...row, ...(saved ?? {}) } : row
                    ),
                }
                : old
        );
    };

    const submit = async (run: () => Promise<unknown>): Promise<SubmitResult> => {
        try {
            const response = await run() as ApiResponse<ExchangeSessionPlayer>;
            if (!response.success) {
                return { success: false, message: response.message, errors: response.errors };
            }
            await queryClient.invalidateQueries({
                queryKey: ["exchange-session-players", slug, sessionId],
            });
            toast.success(response.message || t("saveSuccess"));
            return;
        } catch (error) {
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleTogglePaid = async (row: ExchangeSessionPlayer) => {
        try {
            const response = await paidMutation.mutateAsync(row.id);
            if (!response.success) {
                toast.error(response.message || t("loadError"));
                return;
            }
            updateCachedRow(row.id, response.data ?? { ...row, paid: !row.paid });
            toast.success(response.message || t("updateSuccess"));
        } catch (error) {
            toast.error((error as Error)?.message || t("loadError"));
        }
    };

    return {
        data: query.data?.data ?? [],
        total: query.data?.meta?.total ?? 0,
        isLoading: query.isLoading,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        payingIds: new Set(paidMutation.isPending && paidMutation.variables ? [paidMutation.variables] : []),
        handleCreate: (values: Record<string, string>) =>
            submit(() => createMutation.mutateAsync(values)),
        handleEdit: (id: number, values: Record<string, string>) =>
            submit(() => updateMutation.mutateAsync({ id, values })),
        handleDelete: (id: number) => deleteMutation.mutate(id, {
            onSuccess: async (response) => {
                await queryClient.invalidateQueries({
                    queryKey: ["exchange-session-players", slug, sessionId],
                });
                toast.success((response as ApiResponse<unknown>).message || t("deleteSuccess"));
            },
            onError: (error) => toast.error((error as Error)?.message || t("loadError")),
        }),
        handleTogglePaid,
    };
}
