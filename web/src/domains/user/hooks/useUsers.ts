"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { userServiceClient } from "@/domains/user/services/userService";
import { clubMemberRoleService } from "@/domains/clubMemberRole/services/clubMemberRoleService";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { User, UserFilters } from "@/domains/user/types";
import type { ClubMemberRole } from "@/domains/clubMemberRole/types/index";
import type { SubmitResult, ServerErrorResponse } from "@/components/shared/forms/FormModal";
import type { useListParams } from "@/hooks/useListParams";

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })?.response?.data;
    if (responseData) return responseData;

    if (
        err &&
        typeof err === "object" &&
        "success" in err &&
        (err as ServerErrorResponse).success === false
    ) {
        return err as ServerErrorResponse;
    }

    return null;
}

function buildFormData(values: Record<string, string>): FormData {
    const formData = new FormData();

    Object.entries(values).forEach(([k, v]) => {
        if (v !== "") formData.append(k, v);
    });

    return formData;
}

/**
 * Custom hook quản lý data fetching + cache strategy cho user.
 *
 * Chiến lược cache:
 * - list           → useQuery
 * - create/update  → invalidateQueries
 * - updateStatus   → setQueryData
 * - delete         → setQueryData với data trả về từ BE
 * - sync role      → setQueriesData
 * - remove role    → setQueriesData, không fetch lại users
 */
export function useUsers(
    params: ReturnType<typeof useListParams<UserFilters>>["params"],
) {
    const queryClient = useQueryClient();
    const locale = useLocale();
    const t = useTranslations("common");

    const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<number>>(new Set());

    const queryKey = ["users", locale, params] as const;

    const { data: listData, isLoading, isFetching } = useQuery({
        queryKey,
        queryFn: () => userServiceClient.list(params),
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[1] === locale ? previousData : undefined,
        staleTime: 0,
        refetchOnMount: "always",
    });

    const data = listData?.data ?? [];
    const total = listData?.meta?.total ?? 0;

    const createMutation = useMutation({
        mutationFn: (payload: FormData) => userServiceClient.create(payload),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
            userServiceClient.update(id, payload),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => userServiceClient.destroy(id, params),
        onSuccess: (res) => {
            if ("success" in res && res.success === false) {
                toast.error(res.message || t("loadError"));
                return;
            }

            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<User> | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: res.data ?? old.data,
                        meta: {
                            ...old.meta,
                            total: res.meta?.total ?? old.meta?.total,
                        },
                    };
                },
            );

            toast.success(res.message || t("deleteSuccess"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            (userServiceClient as any).updateStatus(id, status) as Promise<ApiResponse<User>>,
        onSuccess: (res, { id }) => {
            if (!res.success || !res.data) return;

            queryClient.setQueryData(
                queryKey,
                (old: PaginatedResponse<User> | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).map((item) =>
                            item.id === id ? { ...item, ...res.data! } : item,
                        ),
                    };
                },
            );

            toast.success(res.message || t("updateStatus"));
        },
        onError: (error: unknown) => {
            toast.error((error as Error)?.message || t("loadError"));
        },
    });

    const handleCreate = async (
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        try {
            const raw = await createMutation.mutateAsync(buildFormData(values));
            const res = raw as unknown as ApiResponse<User>;

            if (!res.success) {
                toast.error(res.message || t("loadError"));
                return { success: false, message: res.message, errors: res.errors };
            }

            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.message || t("saveSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);

            if (serverErr) {
                toast.error(serverErr.message || t("loadError"));
                return serverErr;
            }

            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleEdit = async (
        id: number,
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        try {
            const raw = await updateMutation.mutateAsync({
                id,
                payload: buildFormData(values),
            });

            const res = raw as unknown as ApiResponse<User>;

            if (!res.success) {
                toast.error(res.message || t("loadError"));
                return { success: false, message: res.message, errors: res.errors };
            }

            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(res.message || t("updateSuccess"));
            return;
        } catch (error: unknown) {
            const serverErr = getServerError(error);

            if (serverErr) {
                toast.error(serverErr.message || t("loadError"));
                return serverErr;
            }

            toast.error((error as Error)?.message || t("loadError"));
            return { success: false };
        }
    };

    const handleDeleteConfirm = (id: number) => {
        deleteMutation.mutate(id);
    };

    const handleStatusChange = (row: User, newStatus: string) => {
        if (updatingStatusIds.has(row.id)) return;

        setUpdatingStatusIds((prev) => new Set(prev).add(row.id));

        updateStatusMutation.mutate(
            { id: row.id, status: newStatus },
            {
                onSettled: () =>
                    setUpdatingStatusIds((prev) => {
                        const next = new Set(prev);
                        next.delete(row.id);
                        return next;
                    }),
            },
        );
    };

    return {
        data,
        total,
        isLoading,
        isFetching,
        updatingStatusIds,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleStatusChange,
    };
}

type SyncUserRolePayload = {
    user_id: number;
    role_slug: string;
};

type SyncRoleResponseData = {
    user_id: number;
    club_id: number | null;
    role: ClubMemberRole;
};

function normalizeClubMemberRole(role: ClubMemberRole): ClubMemberRole {
    const value = role as unknown as {
        id: number;
        slug: string;
        name?: string | null;
        translation?: { name?: string | null } | null;
    };

    return {
        ...role,
        id: value.id,
        slug: value.slug,
        name: value.name ?? value.translation?.name ?? value.slug,
    };
}

function getRoleMutationErrorMessage(error: unknown, fallback: string): string {
    const responseData = (
        error as { response?: { data?: { message?: string } } }
    )?.response?.data;

    if (responseData?.message) return responseData.message;

    if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string" && message) return message;
    }

    return fallback;
}

/** Đồng bộ quyền global bằng role_slug và cập nhật cache danh sách user. */
export function useSyncUserRole() {
    const queryClient = useQueryClient();
    const locale = useLocale();
    const t = useTranslations("common");

    const mutation = useMutation({
        mutationFn: (payload: SyncUserRolePayload) =>
            clubMemberRoleService.syncUserRole(
                payload as unknown as Parameters<typeof clubMemberRoleService.syncUserRole>[0],
            ),
    });

    const handleSyncUserRole = async (
        payload: SyncUserRolePayload,
    ): Promise<boolean> => {
        try {
            const res = await mutation.mutateAsync(payload);

            if (!res.success || !res.data) {
                toast.error(res.message || t("loadError"));
                return false;
            }

            const data = res.data as unknown as SyncRoleResponseData;

            if (data.club_id != null) {
                toast.error("API trả về role không thuộc phạm vi global.");
                return false;
            }

            const normalizedRole = normalizeClubMemberRole(data.role);

            queryClient.setQueriesData<PaginatedResponse<User>>(
                { queryKey: ["users", locale] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).map((item) => {
                            if (item.id !== data.user_id) return item;

                            const roleFields = item as User & { roles?: unknown };

                            const currentRoles =
                                roleFields.roles &&
                                    typeof roleFields.roles === "object" &&
                                    !Array.isArray(roleFields.roles)
                                    ? (roleFields.roles as Record<string, unknown>)
                                    : {};

                            return {
                                ...item,
                                roles: {
                                    ...currentRoles,
                                    global: normalizedRole,
                                },
                            } as User;
                        }),
                    };
                },
            );

            toast.success(res.message || t("saveSuccess"));
            return true;
        } catch (error: unknown) {
            toast.error(getRoleMutationErrorMessage(error, t("loadError")));
            return false;
        }
    };

    return {
        handleSyncUserRole,
        isSyncing: mutation.isPending,
    };
}

/**
 * Gỡ role user và cập nhật trực tiếp cache danh sách user.
 * Không invalidate/refetch danh sách users.
 */
export function useDeleteUserRole() {
    const queryClient = useQueryClient();
    const locale = useLocale();
    const t = useTranslations("common");

    const mutation = useMutation({
        mutationFn: (userId: number) =>
            clubMemberRoleService.deleteUserRole(userId),
    });

    const handleDeleteUserRole = async (userId: number): Promise<boolean> => {
        try {
            const res = await mutation.mutateAsync(userId);

            if (!res.success) {
                toast.error(res.message || t("loadError"));
                return false;
            }

            queryClient.setQueriesData<PaginatedResponse<User>>(
                { queryKey: ["users", locale] },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: (old.data ?? []).map((item) => {
                            if (item.id !== userId) return item;

                            const userWithRoles = item as User & {
                                roles?: unknown;
                            };

                            const currentRoles =
                                userWithRoles.roles &&
                                    typeof userWithRoles.roles === "object" &&
                                    !Array.isArray(userWithRoles.roles)
                                    ? (userWithRoles.roles as Record<string, unknown>)
                                    : {};

                            const { global: _removedGlobalRole, ...remainingRoles } =
                                currentRoles;

                            return {
                                ...item,
                                roles: remainingRoles,
                            } as User;
                        }),
                    };
                },
            );

            toast.success(res.message || t("deleteSuccess"));
            return true;
        } catch (error: unknown) {
            toast.error(getRoleMutationErrorMessage(error, t("loadError")));
            return false;
        }
    };

    return {
        handleDeleteUserRole,
        isDeleting: mutation.isPending,
    };
}

export function useUserSelect(params?: { club_slug?: string | null }) {
    const locale = useLocale();

    const query = useQuery({
        queryKey: ["users-select", locale, params],
        queryFn: () =>
            userServiceClient.select(params) as Promise<ApiResponse<User[]>>,
    });

    return {
        data: query.data?.data ?? [],
        isLoading: query.isLoading,
    };
}