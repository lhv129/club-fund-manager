"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";

import { type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import Select from "@/components/shared/ui/Select";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import Avatar from "@/components/shared/ui/Avatar";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import {
    useClubMembers,
    useSyncClubMemberRole,
} from "@/domains/members/hooks/useClubMembers";
import { useRoleSelect } from "@/domains/role/hooks/useRoles";
import type {
    ClubMember,
    MemberFilters,
} from "@/domains/members/types/member";
import { clubRoute } from "@/constants";
import { Badge } from "@/components/shared/ui/Badge";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { formatDate } from "@/utils/index";

export function MembersPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("member");
    const tu = useTranslations("user");

    const router = useRouter();
    const { hasPermission, isSuperAdmin } = useAuth();
    const { club, slug } = useClub();

    const canView =
        isSuperAdmin ||
        hasPermission("club_member", "view", club?.id);

    const canDelete =
        isSuperAdmin ||
        hasPermission("club_member", "update", club?.id);

    const sortOptions = [
        { value: "joined_at", label: tm("joinedAt") },
    ];

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<MemberFilters>({
        defaultFilters: { search: "" },
        defaultSortBy: "joined_at",
        defaultSortDir: "desc",
    });

    const {
        data,
        total,
        isLoading,
        isFetching,
        isDeleting,
        handleDeleteConfirm,
    } = useClubMembers(
        { ...params, club_slug: slug },
        { status: "approved" }
    );

    const {
        handleSyncClubMemberRole,
        isSyncing: isSyncingRole,
    } = useSyncClubMemberRole(slug);

    const [deleteTarget, setDeleteTarget] =
        useState<ClubMember | null>(null);

    const [roleTarget, setRoleTarget] =
        useState<ClubMember | null>(null);

    const closeRoleModal = () => {
        if (isSyncingRole) return;
        setRoleTarget(null);
    };

    const handleRoleSave = async (
        roleSlug: string,
        selectedRole: NonNullable<ClubMember["role"]>
    ): Promise<boolean> => {
        if (!roleTarget) return false;

        const saved = await handleSyncClubMemberRole(
            roleTarget.user.id,
            roleSlug,
            selectedRole
        );

        if (saved) {
            setRoleTarget(null);
        }

        return saved;
    };

    if (!club || !slug) {
        return null;
    }

    const columns: ColumnDef<ClubMember>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-fg-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "avatar",
            label: tm("avatar"),
            className: "w-14",
            render: (row) => (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background-muted">
                    <Avatar
                        imgUrl={row.user.avatar}
                        userName={row.user.fullname}
                        sizeClass="h-full w-full object-cover"
                    />
                </div>
            ),
        },
        {
            key: "fullname",
            label: t("name"),
            render: (row) => (
                <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-fg">
                        {row.user.fullname}
                    </span>
                    <span className="truncate text-xs text-fg-muted">
                        {row.user.phone ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "gender",
            label: tu("gender"),
            render: (row) => (
                <span className="text-sm text-fg">
                    {row.user.gender === "male"
                        ? tu("genderMale")
                        : row.user.gender === "female"
                            ? tu("genderFemale")
                            : row.user.gender === "other"
                                ? tu("genderOther")
                                : "—"}
                </span>
            ),
        },
        {
            key: "role",
            label: t("role"),
            render: (row) => {
                if (row.user.is_superadmin) {
                    return (
                        <Badge
                            variant="super_admin"
                            title={t("superAdmin")}
                            showDot={false}
                        />
                    );
                }

                if (row.user.is_system_admin) {
                    return (
                        <Badge
                            variant="admin"
                            title={t("systemAdmin")}
                            showDot={false}
                        />
                    );
                }

                if (!row.role) {
                    return (
                        <span className="whitespace-nowrap text-sm text-fg-muted">
                            —
                        </span>
                    );
                }

                return (
                    <Badge
                        variant="role"
                        title={row.role.translation?.name ?? row.role.slug ?? "—"}
                        showDot={false}
                    />
                );
            },
        },
        {
            key: "joined_at",
            label: tm("joinedAt"),
            render: (row) => (
                <span className="whitespace-nowrap text-xs text-fg-muted">
                    {formatDate(row.joined_at)}
                </span>
            ),
        },
        {
            key: "is_active",
            label: t("status"),
            render: (row) => (
                <Badge
                    variant={row.is_active ? "active" : "inactive"}
                    title={row.is_active ? t("active") : t("inactive")}
                    showDot={false}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Breadcrumb
                navItems={CLUB_NAV_ITEMS(slug)}
                homeHref={clubRoute(slug)}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-fg">
                        {tm("title")}
                    </h1>
                    <p className="mt-0.5 text-sm text-fg-muted">
                        {tm("totalCount", {
                            count: total.toLocaleString(),
                        })}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <FilterBar
                    searchClassName="basis-full sm:w-auto sm:basis-auto"
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    loading={isFetching}
                    onApply={(filters) =>
                        updateMany(filters as Partial<typeof params>)
                    }
                    onReset={reset}
                />

                <DataTable
                    table={{
                        columns,
                        data,
                        loading: isLoading,
                        fetching: isFetching,
                        keyExtractor: (row) => row.id,
                        showActions: canView || canDelete,
                        renderActions: (row) => {
                            if (!canView && !canDelete) return null;

                            return (
                                <TableActions>
                                    {canDelete && (
                                        <TableActionItem
                                            icon={
                                                <ShieldCheck className="h-4 w-4" />
                                            }
                                            label={t("role")}
                                            onClick={() =>
                                                setRoleTarget(row)
                                            }
                                        />
                                    )}

                                    {canView && (
                                        <TableActionItem
                                            icon={
                                                <Eye className="h-4 w-4" />
                                            }
                                            label={t("detail")}
                                            onClick={() =>
                                                router.push(
                                                    `${clubRoute(slug)}/members/${row.id}` as never
                                                )
                                            }
                                        />
                                    )}

                                    {canDelete && (
                                        <TableActionItem
                                            icon={
                                                <Trash2 className="h-4 w-4" />
                                            }
                                            label={t("delete")}
                                            variant="danger"
                                            onClick={() =>
                                                setDeleteTarget(row)
                                            }
                                        />
                                    )}
                                </TableActions>
                            );
                        },
                        emptyText: tm("notFound"),
                    }}
                    pagination={{
                        page: params.page,
                        limit: params.limit,
                        total,
                        onPageChange: setPage,
                        onLimitChange: setLimit,
                    }}
                />
            </div>

            {roleTarget && (
                <ClubMemberRoleModal
                    member={roleTarget}
                    onClose={closeRoleModal}
                    onSave={handleRoleSave}
                    isSaving={isSyncingRole}
                />
            )}

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tm("deleteConfirmMsg", {
                            name: deleteTarget.user.fullname,
                        })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (deleteTarget) {
                        handleDeleteConfirm(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />
        </div>
    );
}

interface ClubMemberRoleModalProps {
    member: ClubMember;
    onClose: () => void;
    onSave: (
        roleSlug: string,
        selectedRole: NonNullable<ClubMember["role"]>
    ) => Promise<boolean>;
    isSaving: boolean;
}

function ClubMemberRoleModal({
    member,
    onClose,
    onSave,
    isSaving,
}: ClubMemberRoleModalProps) {
    const locale = useLocale();
    const t = useTranslations("common");

    const {
        data: roles,
        isLoading,
        isFetching,
    } = useRoleSelect({
        search: "",
        is_active: 1,
        scope: "club",
    });

    const [selectedRoleSlug, setSelectedRoleSlug] =
        useState(member.role?.slug ?? "");

    const loadingRoles = isLoading || isFetching;

    const roleOptions = roles.map((role) => {
        const localizedRole = role as typeof role & {
            translations?: Array<{
                locale: string;
                name?: string | null;
            }> | null;
        };

        const translationForLocale =
            localizedRole.translations?.find(
                (translation) => translation.locale === locale
            );

        const fallbackTranslation = role.translation as
            | { locale?: string; name?: string | null }
            | null
            | undefined;

        const translatedName =
            translationForLocale?.name ??
            (fallbackTranslation?.locale === locale ||
                !fallbackTranslation?.locale
                ? fallbackTranslation?.name
                : undefined) ??
            localizedRole.translations?.[0]?.name;

        return {
            value: role.slug,
            label: translatedName || role.slug,
        };
    });

    const selectedRole = roles.find(
        (role) => role.slug === selectedRoleSlug
    );

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!selectedRole) return;

        const saved = await onSave(
            selectedRole.slug,
            selectedRole as NonNullable<ClubMember["role"]>
        );

        if (saved) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSaving
                ) {
                    onClose();
                }
            }}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="club-member-role-title"
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-white p-5 shadow-xl dark:bg-gray-900"
            >
                <div>
                    <h2
                        id="club-member-role-title"
                        className="text-lg font-semibold text-fg"
                    >
                        {t("role")}
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                        {member.user.fullname}
                    </p>
                </div>

                <Select
                    key={locale}
                    label={t("role")}
                    options={roleOptions}
                    value={selectedRoleSlug}
                    onChange={setSelectedRoleSlug}
                    loading={loadingRoles}
                    disabled={isSaving}
                    placeholder={t("role")}
                    className="w-full"
                />

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-800"
                    >
                        {t("cancel")}
                    </button>

                    <button
                        type="submit"
                        disabled={
                            !selectedRole ||
                            loadingRoles ||
                            isSaving
                        }
                        className="rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {t("save")}
                    </button>
                </div>
            </form>
        </div>
    );
}