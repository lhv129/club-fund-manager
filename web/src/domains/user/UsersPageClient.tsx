"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { StatusDropdown, type StatusOption } from "@/components/shared/ui/StatusDropdown";
import Select from "@/components/shared/ui/Select";
import Avatar from "@/components/shared/ui/Avatar";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useDeleteUserRole, useSyncUserRole, useUsers } from "@/domains/user/hooks/useUsers";
import { useRoleSelect } from "@/domains/role/hooks/useRoles";
import type { User, UserFilters, UserStatus } from "@/domains/user/types";
import { APP_ROUTES } from "@/constants";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { Badge } from "@/components/shared/ui/Badge";
import { formatDate } from "@/utils/index";

type UserRoleTranslation = { locale: string; name?: string | null };
type UserRoleEntry = { id: number; slug: string; name?: string | null; translations?: UserRoleTranslation[] | null };

function getLocalizedRoleName(role: UserRoleEntry, locale: string): string {
  return role.translations?.find((translation) => translation.locale === locale)?.name || role.name || role.slug;
}

/**
 * API danh sách users hiện trả roles.global; hỗ trợ role.global để tương thích dữ liệu cũ.
 */
function getGlobalRole(user: User): UserRoleEntry | null {
  const userWithRoleMaps = user as User & { role?: unknown; roles?: unknown };

  for (const value of [userWithRoleMaps.roles, userWithRoleMaps.role]) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;

    const globalRole = (value as Record<string, unknown>).global;
    if (typeof globalRole === "object" && globalRole !== null) return globalRole as UserRoleEntry;
  }

  return null;
}

/** API có thể trả is_superadmin hoặc role: ["*"]. */
function isSuperAdminUser(user: User): boolean {
  const userWithRoleFlags = user as User & { is_superadmin?: unknown; roles?: unknown };

  if (userWithRoleFlags.is_superadmin === true) return true;

  return [userWithRoleFlags.roles].some(
    (value) => Array.isArray(value) && (value as unknown[]).includes("*"),
  );
}

export function UsersPageClient() {
  const locale = useLocale();
  const t = useTranslations("common");
  const tu = useTranslations("user");
  const { hasPermission, isSuperAdmin, user } = useAuth();

  const canView = isSuperAdmin || hasPermission("user", "view");
  const canCreate = isSuperAdmin || hasPermission("user", "create");
  const canUpdate = isSuperAdmin || hasPermission("user", "update");
  const canDelete = isSuperAdmin || hasPermission("user", "delete");
  const canAssignRole = isSuperAdmin || hasPermission("role", "update");

  const statusOptions: StatusOption[] = [
    { value: "active", label: tu("statusActive"), variant: "active" },
    { value: "inactive", label: tu("statusInactive"), variant: "inactive" },
    { value: "locked", label: tu("statusLocked"), variant: "locked" },
  ];

  const statusSelectOptions = statusOptions.map((o) => ({ value: o.value, label: o.label }));

  const verifiedFilterOptions = [
    { value: "1", label: tu("verified") },
    { value: "0", label: tu("unverified") },
  ];

  const genderOptions = [
    { value: "male", label: tu("genderMale") },
    { value: "female", label: tu("genderFemale") },
    { value: "other", label: tu("genderOther") },
  ];

  const sortOptions = [{ value: "created_at", label: t("createdAt") }];

  const { params, setPage, setLimit, updateMany, reset } = useListParams<UserFilters>({
    defaultFilters: { search: "", status: undefined, email_verified_at: undefined },
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  const [draftStatus, setDraftStatus] = useState<UserStatus | undefined>(params.status);
  const [draftVerified, setDraftVerified] = useState<0 | 1 | undefined>(params.email_verified_at);

  useEffect(() => {
    setDraftStatus(params.status);
  }, [params.status]);

  useEffect(() => {
    setDraftVerified(params.email_verified_at);
  }, [params.email_verified_at]);

  const {
    data,
    total,
    isLoading,
    isFetching,
    updatingStatusIds,
    isCreating,
    isUpdating,
    isDeleting,
    handleCreate,
    handleEdit,
    handleDeleteConfirm,
    handleStatusChange,
  } = useUsers(params);

  const { handleSyncUserRole, isSyncing: isSyncingUserRole } = useSyncUserRole();
  const { handleDeleteUserRole, isDeleting: isDeletingUserRole } = useDeleteUserRole();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);

  const currentRoleTarget = roleTarget
    ? data.find((item) => item.id === roleTarget.id) ?? roleTarget
    : null;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: User) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const openRoleModal = (row: User) => setRoleTarget(row);

  const closeRoleModal = () => {
    if (isSyncingUserRole || isDeletingUserRole) return;
    setRoleTarget(null);
  };

  const handleRoleSubmit = async (userId: number, roleSlug: string): Promise<boolean> => {
    const saved = await handleSyncUserRole({ user_id: userId, role_slug: roleSlug });
    if (saved) setRoleTarget(null);
    return saved;
  };

  const handleRoleDelete = async (userId: number): Promise<boolean> => {
    const deleted = await handleDeleteUserRole(userId);
    if (deleted) setRoleTarget(null);
    return deleted;
  };

  const handleApply = (filters: AppliedFilters) => {
    updateMany({
      search: filters.search,
      sort_by: filters.sort_by,
      sort_dir: filters.sort_dir,
      status: draftStatus,
      email_verified_at: draftVerified,
    });
  };

  const handleReset = () => {
    setDraftStatus(undefined);
    setDraftVerified(undefined);
    reset();
  };

  const handleSubmit = async (values: Record<string, string>): Promise<SubmitResult> => {
    const result = editing
      ? await handleEdit(editing.id, values)
      : await handleCreate(values);

    if (!result) closeModal();
    return result;
  };

  const columns: ColumnDef<User>[] = [
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
      label: tu("avatar"),
      className: "w-14",
      render: (row) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Avatar imgUrl={row.avatar} userName={row.fullname} sizeClass="w-full h-full object-cover" />
        </div>
      ),
    },
    {
      key: "fullname",
      label: t("name"),
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-fg font-medium truncate">{row.fullname}</span>
          <span className="text-fg-muted text-xs truncate">{row.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: tu("phone"),
      render: (row) => (
        <span className="text-sm text-fg whitespace-nowrap">{row.phone ?? "—"}</span>
      ),
    },
    {
      key: "gender",
      label: tu("gender"),
      render: (row) => (
        <span className="text-sm text-fg">
          {row.gender === "male"
            ? tu("genderMale")
            : row.gender === "female"
              ? tu("genderFemale")
              : row.gender === "other"
                ? tu("genderOther")
                : "—"}
        </span>
      ),
    },
    {
      key: "date_of_birth",
      label: tu("dateOfBirth"),
      render: (row) => (
        <span className="text-sm text-fg-muted whitespace-nowrap">
          {formatDate(row.date_of_birth)}
        </span>
      ),
    },
    {
      key: "role",
      label: t("role"),
      render: (row) => {
        if (isSuperAdminUser(row)) {
          return <Badge variant="super_admin" title="SuperAdmin" showDot={false} />;
        }

        const globalRole = getGlobalRole(row);

        if (!globalRole) {
          return <span className="text-sm text-fg-muted whitespace-nowrap">—</span>;
        }

        return (
          <Badge
            variant={row.is_system_admin ? "admin" : "role"}
            title={getLocalizedRoleName(globalRole, locale)}
            showDot={false}
          />
        );
      },
    },
    {
      key: "email_verified_at",
      label: tu("emailVerified"),
      render: (row) => (
        <Badge
          variant={row.email_verified_at ? "active" : "inactive"}
          title={row.email_verified_at ? tu("verified") : tu("unverified")}
          showDot={false}
        />
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (row) => {
        const statusLabel = statusOptions.find((option) => option.value === row.status)?.label;

        if (!canUpdate) {
          return (
            <span className="text-sm text-fg-muted whitespace-nowrap">
              {statusLabel ?? row.status}
            </span>
          );
        }

        return (
          <StatusDropdown
            value={row.status}
            options={statusOptions}
            loading={updatingStatusIds.has(row.id)}
            disabled={row.id === user?.id}
            onChange={(newStatus) => handleStatusChange(row, newStatus)}
          />
        );
      },
    },
    {
      key: "created_at",
      label: t("createdAt"),
      render: (row) => (
        <span className="text-xs text-fg-muted whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  const extraFilters = (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tu("status")}</span>
        <Select
          key={locale}
          label={tu("status")}
          options={statusSelectOptions}
          value={draftStatus ?? ""}
          onChange={(v) => setDraftStatus((v || undefined) as UserStatus | undefined)}
          placeholder={t("all")}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {tu("emailVerified")}
        </span>
        <Select
          key={locale}
          label={tu("emailVerified")}
          options={verifiedFilterOptions}
          value={draftVerified !== undefined ? String(draftVerified) : ""}
          onChange={(v) => setDraftVerified(v === "" ? undefined : (Number(v) as 0 | 1))}
          placeholder={t("all")}
        />
      </div>
    </>
  );

  const baseFields = [
    { name: "first_name", label: tu("firstName"), type: "text" as const, placeholder: tu("firstNamePlaceholder") },
    { name: "last_name", label: tu("lastName"), type: "text" as const, placeholder: tu("lastNamePlaceholder") },
    { name: "username", label: tu("username"), type: "text" as const, required: true, placeholder: tu("usernamePlaceholder") },
    { name: "email", label: t("email"), type: "email" as const, required: true, placeholder: tu("emailPlaceholder") },
    { name: "phone", label: tu("phone"), type: "text" as const, placeholder: tu("phonePlaceholder") },
    { name: "address", label: tu("address"), type: "text" as const, placeholder: tu("addressPlaceholder") },
    { name: "date_of_birth", label: tu("dateOfBirth"), type: "datepicker" as const },
    { name: "gender", label: tu("gender"), type: "select" as const, options: genderOptions, placeholder: tu("genderPlaceholder") },
    { name: "status", label: t("status"), type: "select" as const, required: true, options: statusSelectOptions, placeholder: tu("statusPlaceholder") },
  ];

  const createOnlyFields = [
    { name: "password", label: tu("password"), type: "password" as const, required: true, placeholder: tu("passwordPlaceholder") },
  ];

  const formFields = editing ? baseFields : [...baseFields, ...createOnlyFields];

  const formInitialValues = {
    first_name: editing?.first_name ?? "",
    last_name: editing?.last_name ?? "",
    username: editing?.username ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    address: editing?.address ?? "",
    date_of_birth: editing?.date_of_birth ?? "",
    gender: editing?.gender ?? "",
    status: editing?.status ?? "active",
    ...(!editing && { password: "" }),
  };

  return (
    <div className="space-y-6">
      <Breadcrumb homeHref={APP_ROUTES.admin} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">{tu("title")}</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {tu("totalCount", { count: total.toLocaleString() })}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {tu("create")}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterBar
          searchClassName="basis-full sm:w-auto sm:basis-auto"
          search={params.search}
          sortBy={params.sort_by}
          sortDir={params.sort_dir}
          sortOptions={sortOptions}
          showStatusFilter={false}
          loading={isFetching}
          onApply={handleApply}
          onReset={handleReset}
          extraFilters={extraFilters}
          searchPlaceholder={tu("searchPlaceholder")}
        />

        <DataTable
          table={{
            columns,
            data,
            loading: isLoading,
            fetching: isFetching,
            keyExtractor: (row) => row.id,
            showActions: canView || canUpdate || canDelete || canAssignRole,
            renderActions: (row) => {
              const showEdit = canUpdate;
              const showDelete = canDelete && row.id !== user?.id;
              const showRole = canAssignRole && !isSuperAdminUser(row);

              if (!showEdit && !showDelete && !showRole) return null;

              return (
                <TableActions>
                  {showRole && (
                    <TableActionItem
                      icon={<ShieldCheck className="w-4 h-4" />}
                      label={t("role")}
                      onClick={() => openRoleModal(row)}
                    />
                  )}
                  {showEdit && (
                    <TableActionItem
                      icon={<Pencil className="w-4 h-4" />}
                      label={t("edit")}
                      onClick={() => openEdit(row)}
                    />
                  )}
                  {showDelete && (
                    <TableActionItem
                      icon={<Trash2 className="w-4 h-4" />}
                      label={t("delete")}
                      variant="danger"
                      onClick={() => setDeleteTarget(row)}
                    />
                  )}
                </TableActions>
              );
            },
            emptyText: tu("notFound"),
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

      <FormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        title={editing ? tu("edit") : tu("create")}
        isEdit={!!editing}
        submitting={editing ? isUpdating : isCreating}
        fields={formFields}
        initialValues={formInitialValues}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        message={deleteTarget ? tu("deleteConfirmMsg", { name: deleteTarget.fullname }) : ""}
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

      {currentRoleTarget && (
        <UserRoleModal
          key={locale}
          user={currentRoleTarget}
          onClose={closeRoleModal}
          onSave={(roleSlug) => handleRoleSubmit(currentRoleTarget.id, roleSlug)}
          onDelete={() => handleRoleDelete(currentRoleTarget.id)}
          isSaving={isSyncingUserRole}
          isDeleting={isDeletingUserRole}
        />
      )}
    </div>
  );
}

interface UserRoleModalProps {
  user: User;
  onClose: () => void;
  onSave: (roleSlug: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  isSaving: boolean;
  isDeleting: boolean;
}

function UserRoleModal({
  user,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: UserRoleModalProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const tu = useTranslations("user");

  const { data: roles, isLoading, isFetching } = useRoleSelect({
    search: "",
    is_active: 1,
    scope: "global",
  });

  const [selectedRoleSlug, setSelectedRoleSlug] = useState(
    getGlobalRole(user)?.slug ?? "",
  );
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const loadingRoles = isLoading || isFetching;

  const roleOptions = roles.map((role) => {
    const localizedRole = role as typeof role & {
      translations?: Array<{ locale: string; name?: string | null }> | null;
    };

    const translationForLocale = localizedRole.translations?.find(
      (translation) => translation.locale === locale,
    );

    const fallbackTranslation = role.translation as
      | { locale?: string; name?: string | null }
      | null
      | undefined;

    const translatedName =
      translationForLocale?.name ??
      (fallbackTranslation?.locale === locale || !fallbackTranslation?.locale
        ? fallbackTranslation?.name
        : undefined) ??
      localizedRole.translations?.[0]?.name;

    return {
      value: role.slug,
      label: translatedName || role.slug,
    };
  });

  const selectedRole = roles.find((role) => role.slug === selectedRoleSlug);
  const currentRole = getGlobalRole(user);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) return;

    const saved = await onSave(selectedRole.slug);
    if (saved) setConfirmRemoveOpen(false);
  };

  const handleConfirmRemove = async () => {
    const deleted = await onDelete();
    if (deleted) setConfirmRemoveOpen(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving && !isDeleting) onClose();
        }}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-role-modal-title"
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-white p-5 shadow-xl dark:bg-gray-900"
        >
          <div>
            <h2 id="user-role-modal-title" className="text-lg font-semibold text-fg">
              {t("role")}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">{user.fullname}</p>
          </div>

          <Select
            key={locale}
            label={t("role")}
            options={roleOptions}
            value={selectedRoleSlug}
            onChange={setSelectedRoleSlug}
            loading={loadingRoles}
            disabled={isSaving || isDeleting}
            placeholder={t("role")}
            className="w-full"
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            {currentRole && (
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={isDeleting || isSaving}
                className="mr-auto rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
              >
                {t("delete")}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-800"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={!selectedRole || loadingRoles || isSaving || isDeleting}
              className="rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>

      <DeleteConfirmModal
        isOpen={confirmRemoveOpen}
        title={tu("removeRoleConfirmTitle")}
        description={t("deleteConfirmDesc")}
        message={
          currentRole
            ? tu("removeRoleConfirmMsg", {
              role: getLocalizedRoleName(currentRole, locale),
            })
            : ""
        }
        confirmText={t("delete")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveOpen(false)}
        loading={isDeleting}
      />
    </>
  );
}