"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { SubmitResult } from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { getExchangeSessionPlayerService } from "../services/exchangeSessionService";
import type { ExchangeSessionPlayer, ExchangeSessionPlayerFilters } from "../types";

type Params = ReturnType<typeof useListParams<ExchangeSessionPlayerFilters>>["params"] & {
    exchange_session_id: number;
};

export function useExchangeSessionPlayers(params: Params) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const sessionId = params.exchange_session_id;
    const clubSlug = params.club_slug as string | undefined;
    const service = getExchangeSessionPlayerService(sessionId);
    const queryKey = ["exchange-session-players", params] as const;
    const mutationScope = clubSlug ? { club_slug: clubSlug } : undefined;

    const makePayload = (values: Record<string, string>) => ({
        user_id: values.user_id ? Number(values.user_id) : null,
        player_name: values.player_name || null,
        male: Number(values.male || 0),
        female: Number(values.female || 0),
        ...(mutationScope ?? {}),
    });

    const query = useQuery({
        queryKey,

        queryFn: () => {
            return service.list(
                params,
            ) as Promise<
                PaginatedResponse<ExchangeSessionPlayer>
            >;
        },

        enabled:    
            Number.isFinite(sessionId) &&
            sessionId > 0,

        placeholderData: keepPreviousData,
    });

    const createMutation = useMutation({ mutationFn: (values: Record<string, string>) => service.create(makePayload(values)) });
    const updateMutation = useMutation({ mutationFn: ({ id, values }: { id: number; values: Record<string, string> }) => service.update(id, makePayload(values)) });
    const deleteMutation = useMutation({ mutationFn: (id: number) => service.destroy(id, mutationScope) });
    const paidMutation = useMutation({ mutationFn: (id: number) => service.togglePaid(id, mutationScope) });

    const submit = async (run: () => Promise<unknown>): Promise<SubmitResult> => {
        try {
            const response = await run() as ApiResponse<ExchangeSessionPlayer>;
            if (!response.success) return { success: false, message: response.message, errors: response.errors };
            await queryClient.invalidateQueries({ queryKey: ["exchange-session-players"] });
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
            if (!response.success) return toast.error(response.message || t("loadError"));
            queryClient.setQueryData<PaginatedResponse<ExchangeSessionPlayer>>(queryKey, (old) => old ? {
                ...old,
                data: (old.data ?? []).map((item) => item.id === row.id ? { ...item, ...(response.data ?? {}), paid: response.data?.paid ?? !row.paid } : item),
            } : old);
            toast.success(response.message || t("updateSuccess"));
        } catch (error) {
            toast.error((error as Error)?.message || t("loadError"));
        }
    };

    return {
        data: query.data?.data ?? [],
        total: query.data?.meta?.total ?? 0,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        payingIds: new Set(paidMutation.isPending && paidMutation.variables ? [paidMutation.variables] : []),
        handleCreate: (values: Record<string, string>) => submit(() => createMutation.mutateAsync(values)),
        handleEdit: (id: number, values: Record<string, string>) => submit(() => updateMutation.mutateAsync({ id, values })),
        handleDelete: (id: number) => deleteMutation.mutate(id, {
            onSuccess: async (response) => {
                await queryClient.invalidateQueries({ queryKey: ["exchange-session-players"] });
                toast.success((response as ApiResponse<unknown>).message || t("deleteSuccess"));
            },
            onError: (error) => toast.error((error as Error)?.message || t("loadError")),
        }),
        handleTogglePaid,
    };
}
