"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { ServerErrorResponse, SubmitResult, TranslationEntry } from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { exchangeSessionService } from "../services/exchangeSessionService";
import type { ExchangeSession, ExchangeSessionFilters } from "../types";

type Params = ReturnType<typeof useListParams<ExchangeSessionFilters>>["params"];

function getServerError(error: unknown): ServerErrorResponse | null {
    return (error as { response?: { data?: ServerErrorResponse } })?.response?.data ?? null;
}

function buildPayload(values: Record<string, string>, translations?: TranslationEntry[]) {
    const formData = new FormData();
    ["playing_schedule_id", "session_date", "court_name", "court_address", "start_time", "end_time", "type", "status", "sort_order"].forEach((key) => {
        formData.append(key, values[key] ?? "");
    });
    (translations ?? []).forEach((entry) => {
        const translation = entry as Record<string, string>;
        formData.append(`translations[${entry.locale}][title]`, translation.title ?? "");
        formData.append(`translations[${entry.locale}][note]`, translation.note ?? "");
    });
    return formData;
}

export function useExchangeSessions(params: Params) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const clubSlug = params.club_slug as string | undefined;
    const queryKey = ["exchange-sessions", params] as const;
    const mutationScope = clubSlug ? { club_slug: clubSlug } : undefined;

    const query = useQuery({
        queryKey,

        queryFn: () => {
            return exchangeSessionService.list(
                params,
            ) as Promise<
                PaginatedResponse<ExchangeSession>
            >;
        },

        placeholderData: keepPreviousData,
    });

    const createMutation = useMutation({
        mutationFn: (payload: FormData) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return exchangeSessionService.create(payload);
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return exchangeSessionService.update(id, payload);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => exchangeSessionService.destroy(id, mutationScope),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: ["exchange-sessions"] });
            toast.success((response as ApiResponse<unknown>).message || t("deleteSuccess"));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t("loadError")),
    });
    const completeMutation = useMutation({
        mutationFn: (id: number) => exchangeSessionService.complete(id, mutationScope),
    });

    const submit = async (run: () => Promise<unknown>, message: string): Promise<SubmitResult> => {
        try {
            const response = await run() as ApiResponse<ExchangeSession>;
            if (!response.success) return { success: false, message: response.message, errors: response.errors };
            await queryClient.invalidateQueries({ queryKey: ["exchange-sessions"] });
            toast.success(response.message || t(message));
            return;
        } catch (error) {
            const serverError = getServerError(error);
            if (serverError) return serverError;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleComplete = async (id: number) => {
        try {
            const response = await completeMutation.mutateAsync(id);
            if (!response.success) return toast.error(response.message || t("loadError"));
            queryClient.setQueryData<PaginatedResponse<ExchangeSession>>(queryKey, (old) => old ? {
                ...old,
                data: (old.data ?? []).map((row) => row.id === id ? { ...row, ...(response.data ?? {}), status: "completed" } : row),
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
        isCompleting: completeMutation.isPending,
        handleCreate: (values: Record<string, string>, translations?: TranslationEntry[]) => submit(() => createMutation.mutateAsync(buildPayload(values, translations)), "saveSuccess"),
        handleEdit: (id: number, values: Record<string, string>, translations?: TranslationEntry[]) => submit(() => updateMutation.mutateAsync({ id, payload: buildPayload(values, translations) }), "updateSuccess"),
        handleDelete: (id: number) => deleteMutation.mutate(id),
        handleComplete,
    };
}
