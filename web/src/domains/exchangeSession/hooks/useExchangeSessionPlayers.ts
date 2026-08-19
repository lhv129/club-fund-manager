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
import type {
    ExchangeSessionPlayer,
    ExchangeSessionPlayerFilters,
} from "../types";

type Params =
    ReturnType<
        typeof useListParams<ExchangeSessionPlayerFilters>
    >["params"] & {
        exchange_session_id?: number;
    };

export function useExchangeSessionPlayers(params: Params) {
    const queryClient = useQueryClient();
    const t = useTranslations("common");

    const sessionId =
        params.exchange_session_id === undefined
            ? undefined
            : Number(params.exchange_session_id);

    const clubSlug = params.club_slug as string | undefined;

    const service = getExchangeSessionPlayerService(sessionId);

    const queryKey = ["exchange-session-players", params] as const;

    const mutationScope = clubSlug
        ? { club_slug: clubSlug }
        : undefined;

    // -------------------------------------------------------------------------
    // Payload
    // -------------------------------------------------------------------------

    const makePayload = (values: Record<string, string>) => ({
        user_id: values.user_id ? Number(values.user_id) : null,
        group_name: values.group_name || null,
        male: Number(values.male || 0),
        female: Number(values.female || 0),
        ...(mutationScope ?? {}),
    });

    // -------------------------------------------------------------------------
    // Fetch
    // -------------------------------------------------------------------------

    const query = useQuery({
        queryKey,

        queryFn: () => service.list(params),

        enabled:
            Boolean(clubSlug) &&
            (
                sessionId === undefined ||
                (Number.isFinite(sessionId) && sessionId > 0)
            ),

        placeholderData: keepPreviousData,
    });

    // -------------------------------------------------------------------------
    // Mutations
    // -------------------------------------------------------------------------

    const createMutation = useMutation({
        mutationFn: (
            values: Record<string, string>
        ) => service.create(makePayload(values)),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            values,
        }: {
            id: number;
            values: Record<string, string>;
        }) =>
            service.update(
                id,
                makePayload(values)
            ),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) =>
            service.destroy(id, mutationScope),
    });

    const paidMutation = useMutation({
        mutationFn: ({
            id,
            sessionId,
        }: {
            id: number;
            sessionId: number;
        }) =>
            getExchangeSessionPlayerService(sessionId).togglePaid(
                id,
                sessionId,
                mutationScope
            ),
    });

    // -------------------------------------------------------------------------
    // Common submit handler
    // -------------------------------------------------------------------------

    const submit = async (
        run: () => Promise<unknown>
    ): Promise<SubmitResult> => {
        try {
            const response =
                await run() as ApiResponse<ExchangeSessionPlayer>;

            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    errors: response.errors,
                };
            }

            await queryClient.invalidateQueries({
                queryKey: ["exchange-session-players"],
            });

            toast.success(
                response.message || t("saveSuccess")
            );

            // undefined => FormModal tự đóng
            return;
        } catch (error) {
            toast.error(
                (error as Error)?.message ||
                t("loadError")
            );

            return {
                success: false,
            };
        }
    };

    // -------------------------------------------------------------------------
    // Toggle paid
    // -------------------------------------------------------------------------

    const handleTogglePaid = async (
        row: ExchangeSessionPlayer
    ) => {
        try {
            const response =
                await paidMutation.mutateAsync({
                    id: row.id,
                    sessionId: row.exchange_session_id,
                });

            if (!response.success) {
                toast.error(
                    response.message || t("loadError")
                );

                return;
            }

            const saved = response.data;

            const nextPaid =
                saved?.paid ?? !row.paid;

            queryClient.setQueryData<
                PaginatedResponse<ExchangeSessionPlayer>
            >(
                queryKey,
                (old) => {
                    if (!old) {
                        return old;
                    }

                    // Normalize data để tránh:
                    // "'old.data' is possibly 'undefined'"
                    const data = old.data ?? [];

                    const paidFilter =
                        params.paid === undefined
                            ? undefined
                            : Number(params.paid);

                    const matchesPaidFilter =
                        paidFilter === undefined ||
                        paidFilter === (nextPaid ? 1 : 0);

                    const hasRow =
                        data.some(
                            (item) => item.id === row.id
                        );

                    // -----------------------------------------------------------------
                    // Nếu đang filter paid/unpaid và row sau khi toggle
                    // không còn match filter hiện tại -> remove khỏi cache
                    // -----------------------------------------------------------------

                    if (!matchesPaidFilter) {
                        if (!hasRow) {
                            return old;
                        }

                        return {
                            ...old,

                            data: data.filter(
                                (item) => item.id !== row.id
                            ),

                            meta: {
                                ...old.meta,
                                total: Math.max(
                                    0,
                                    (old.meta?.total ?? 1) - 1
                                ),
                            },
                        };
                    }

                    // -----------------------------------------------------------------
                    // Row vẫn match filter -> update trực tiếp cache
                    // -----------------------------------------------------------------

                    return {
                        ...old,

                        data: data.map(
                            (item) =>
                                item.id === row.id
                                    ? {
                                        ...item,
                                        ...(saved ?? {}),
                                        paid: nextPaid,
                                    }
                                    : item
                        ),
                    };
                }
            );

            toast.success(
                response.message ||
                t("updateSuccess")
            );
        } catch (error) {
            toast.error(
                (error as Error)?.message ||
                t("loadError")
            );
        }
    };

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------

    return {
        data: query.data?.data ?? [],

        total: query.data?.meta?.total ?? 0,

        isLoading: query.isLoading,

        isFetching: query.isFetching,

        isCreating: createMutation.isPending,

        isUpdating: updateMutation.isPending,

        isDeleting: deleteMutation.isPending,

        payingIds: new Set(
            paidMutation.isPending &&
                paidMutation.variables
                ? [paidMutation.variables.id]
                : []
        ),

        handleCreate: (
            values: Record<string, string>
        ) =>
            submit(
                () => createMutation.mutateAsync(values)
            ),

        handleEdit: (
            id: number,
            values: Record<string, string>
        ) =>
            submit(
                () =>
                    updateMutation.mutateAsync({
                        id,
                        values,
                    })
            ),

        handleDelete: (
            id: number
        ) =>
            deleteMutation.mutate(id, {
                onSuccess: async (response) => {
                    await queryClient.invalidateQueries({
                        queryKey: [
                            "exchange-session-players",
                        ],
                    });

                    toast.success(
                        (response as ApiResponse<unknown>)
                            .message ||
                        t("deleteSuccess")
                    );
                },

                onError: (error) => {
                    toast.error(
                        (error as Error)?.message ||
                        t("loadError")
                    );
                },
            }),

        handleTogglePaid,
    };
}