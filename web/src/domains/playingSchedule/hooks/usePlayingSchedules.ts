"use client";

import { useState } from "react";
import { keepPreviousData, useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { ServerErrorResponse, SubmitResult, TranslationEntry } from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { playingScheduleService } from "../services/playingScheduleService";
import type { PlayingSchedule, PlayingScheduleFilters } from "../types";

type Params = ReturnType<typeof useListParams<PlayingScheduleFilters>>["params"];

function getServerError(error: unknown): ServerErrorResponse | null {
    const data = (error as { response?: { data?: ServerErrorResponse } })?.response?.data;
    if (data) return data;
    return error && typeof error === "object" && "success" in error && (error as ServerErrorResponse).success === false
        ? error as ServerErrorResponse
        : null;
}

function buildPayload(values: Record<string, string>, translations?: TranslationEntry[]) {
    const formData = new FormData();
    ["weekday", "court_name", "court_address", "start_time", "end_time", "weeks_ahead", "sort_order"].forEach((key) => {
        formData.append(key, values[key] ?? "");
    });
    ["auto_generate", "is_active"].forEach((key) => {
        formData.append(key, values[key] === "1" || values[key] === "true" ? "1" : "0");
    });
    (translations ?? []).forEach((entry) => {
        const translation = entry as Record<string, string>;
        formData.append(`translations[${entry.locale}][title]`, translation.title ?? "");
        formData.append(`translations[${entry.locale}][note]`, translation.note ?? "");
    });
    return formData;
}

export function usePlayingSchedules(params: Params) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const clubSlug = params.club_slug as string | undefined;
    const mutationScope = clubSlug ? { club_slug: clubSlug } : undefined;
    const queryKey = ["playing-schedules", params] as const;

    const query = useQuery({
        queryKey,
        queryFn: () => playingScheduleService.list(params) as Promise<PaginatedResponse<PlayingSchedule>>,
        placeholderData: keepPreviousData,
    });
    const createMutation = useMutation({
        mutationFn: (payload: FormData) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return playingScheduleService.create(payload);
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) => {
            if (clubSlug) payload.set("club_slug", clubSlug);
            return playingScheduleService.update(id, payload);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => playingScheduleService.destroy(id, mutationScope),
        onSuccess: (response, id) => {
            if (!(response as ApiResponse<unknown>).success) return;
            queryClient.setQueryData<PaginatedResponse<PlayingSchedule>>(queryKey, (old) => old ? {
                ...old,
                data: (old.data ?? []).filter((item) => item.id !== id),
                meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) },
            } : old);
            toast.success((response as ApiResponse<unknown>).message || t("deleteSuccess"));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t("loadError")),
    });
    const toggleMutation = useMutation({
        mutationFn: (id: number) => playingScheduleService.toggleStatus(id, mutationScope),
        onSuccess: (response, id) => {
            if (!response.success) return toast.error(response.message || t("loadError"));
            queryClient.setQueryData<PaginatedResponse<PlayingSchedule>>(queryKey, (old) => old ? {
                ...old,
                data: (old.data ?? []).map((item) => item.id === id
                    ? { ...item, ...(response.data ?? {}), is_active: response.data?.is_active ?? !item.is_active }
                    : item),
            } : old);
            toast.success(response.message || t("updateStatus"));
        },
        onError: (error: unknown) => toast.error((error as Error)?.message || t("loadError")),
    });

    const submit = async (run: () => Promise<unknown>, message: string): Promise<SubmitResult> => {
        try {
            const response = await run() as ApiResponse<PlayingSchedule>;
            if (!response.success) return { success: false, message: response.message, errors: response.errors };
            await queryClient.invalidateQueries({ queryKey: ["playing-schedules"] });
            toast.success(response.message || t(message));
            return;
        } catch (error) {
            const serverError = getServerError(error);
            if (serverError) return serverError;
            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
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
        togglingIds,
        handleCreate: (values: Record<string, string>, translations?: TranslationEntry[]) => submit(() => createMutation.mutateAsync(buildPayload(values, translations)), "saveSuccess"),
        handleEdit: (id: number, values: Record<string, string>, translations?: TranslationEntry[]) => submit(() => updateMutation.mutateAsync({ id, payload: buildPayload(values, translations) }), "updateSuccess"),
        handleDeleteConfirm: (id: number) => deleteMutation.mutate(id),
        handleToggleStatus: (id: number) => {
            if (togglingIds.has(id)) return;
            setTogglingIds((previous) => new Set(previous).add(id));
            toggleMutation.mutate(id, {
                onSettled: () => setTogglingIds((previous) => {
                    const next = new Set(previous);
                    next.delete(id);
                    return next;
                }),
            });
        },
    };
}

export function usePlayingScheduleSelect(params?: Partial<PlayingScheduleFilters> & { club_slug?: string | null }) {
    const query = useQuery({
        queryKey: ["playing-schedules-select", params],
        queryFn: () => playingScheduleService.select(params) as Promise<ApiResponse<PlayingSchedule[]>>,
    });
    return { data: query.data?.data ?? [], isLoading: query.isLoading };
}
