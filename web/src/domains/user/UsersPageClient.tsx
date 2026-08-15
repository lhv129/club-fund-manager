// src/app/[locale]/admin/(system)/users/UsersPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Table, ColumnDef } from "@/components/shared/ui/Table";
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
import { useUsers } from "@/domains/user/hooks/useUsers";
import type { User, UserFilters, UserStatus } from "@/domains/user/types";
import { APP_ROUTES } from "@/constants";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { Badge } from "@/components/shared/ui/Badge";

// ─── Helper ───────────────────────────────────────────────────────────────────
import { formatDate } from "@/utils/index";

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersPageClient() {
  const t = useTranslations("common");
  const tu = useTranslations("user");
  const { hasPermission, isSuperAdmin, user } = useAuth();

  const canCreate = isSuperAdmin || hasPermission("user", "create");
  const canUpdate = isSuperAdmin || hasPermission("user", "update");
  const canDelete = isSuperAdmin || hasPermission("user", "delete");

  // ── Options ───────────────────────────────────────────────────────────────
  const statusOptions: StatusOption[] = [
    { value: "active", label: tu("statusActive"), variant: "active" },
    { value: "inactive", label: tu("statusInactive"), variant: "inactive" },
    { value: "locked", label: tu("statusLocked"), variant: "locked" },
  ];

  const statusSelectOptions = statusOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const verifiedFilterOptions = [
    { value: "1", label: tu("verified") },
    { value: "0", label: tu("unverified") },
  ];

  const genderOptions = [
    { value: "male", label: tu("genderMale") },
    { value: "female", label: tu("genderFemale") },
    { value: "other", label: tu("genderOther") },
  ];

  const sortOptions = [
    { value: "created_at", label: t("createdAt") },
  ];

  // ── List params ───────────────────────────────────────────────────────────
  const { params, setPage, setLimit, updateMany, reset } =
    useListParams<UserFilters>({
      defaultFilters: { search: "", status: undefined, email_verified_at: undefined },
      defaultSortBy: "created_at",
      defaultSortDir: "desc",
    });

  // Draft cho extraFilters (chỉ apply khi bấm "Tìm kiếm")
  const [draftStatus, setDraftStatus] = useState<UserStatus | undefined>(params.status);
  const [draftVerified, setDraftVerified] = useState<0 | 1 | undefined>(params.email_verified_at);

  useEffect(() => { setDraftStatus(params.status); }, [params.status]);
  useEffect(() => { setDraftVerified(params.email_verified_at); }, [params.email_verified_at]);

  // ── Cache hook ────────────────────────────────────────────────────────────
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

  // ── UI state (chỉ liên quan render) ──────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row: User) => { setEditing(row); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  // ── FilterBar handlers ────────────────────────────────────────────────────
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

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (
    values: Record<string, string>
  ): Promise<SubmitResult> => {
    const result = editing
      ? await handleEdit(editing.id, values)
      : await handleCreate(values);

    if (!result) closeModal();
    return result;
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ColumnDef<User>[] = [
    {
      key: "stt", label: t("no"), className: "w-12",
      render: (_row, index) => (
        <span className="text-fg-muted text-xs">
          {(params.page - 1) * params.limit + index + 1}
        </span>
      ),
    },
    {
      key: "avatar", label: tu("avatar"), className: "w-14",
      render: (row) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800
                    flex items-center justify-center shrink-0">
          <Avatar
            imgUrl={row.avatar}
            userName={row.fullname}
            sizeClass="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "fullname", label: t("name"),
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-fg font-medium truncate">{row.fullname}</span>
          <span className="text-fg-muted text-xs truncate">{row.email}</span>
        </div>
      ),
    },
    {
      key: "phone", label: tu("phone"),
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
      key: "date_of_birth", label: tu("dateOfBirth"),
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
        if (row.is_superadmin) {
          return (
            <Badge
              variant="super_admin"
              title={t("superAdmin")}
              showDot={false}
            />
          );
        }

        if (row.is_system_admin) {
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
            <span className="text-sm text-fg-muted whitespace-nowrap">
              —
            </span>
          );
        }

        return (
          <Badge
            variant="role"
            title={row.role.translation?.name ?? "—"}
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
      key: "status", label: t("status"),
      render: (row) => (
        <StatusDropdown
          value={row.status}
          options={statusOptions}
          loading={updatingStatusIds.has(row.id)}
          disabled={!canUpdate || row.id === user?.id}
          onChange={(newStatus) => handleStatusChange(row, newStatus)}
        />
      ),
    },
    {
      key: "created_at", label: t("createdAt"),
      render: (row) => (
        <span className="text-xs text-fg-muted whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  // ── extraFilters ──────────────────────────────────────────────────────────
  const extraFilters = (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {tu("status")}
        </span>
        <Select
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
          label={tu("emailVerified")}
          options={verifiedFilterOptions}
          value={draftVerified !== undefined ? String(draftVerified) : ""}
          onChange={(v) => setDraftVerified(v === "" ? undefined : (Number(v) as 0 | 1))}
          placeholder={t("all")}
        />
      </div>
    </>
  );

  // ── Form fields ───────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Breadcrumb homeHref={APP_ROUTES.admin} />
      {/* Header */}
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
                            hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />{tu("create")}
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
          table={{ columns, data, loading: isLoading, fetching: isFetching,
          keyExtractor: (row) => row.id,
          showActions: canUpdate || canDelete,
          renderActions: (row) => {
            const showEdit = canUpdate;
            const showDelete = canDelete && row.id !== user?.id;

            if (!showEdit && !showDelete) return null;

            return (
              <TableActions>
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
          }, emptyText: tu("notFound") }}
          pagination={{ page: params.page, limit: params.limit, total, onPageChange: setPage, onLimitChange: setLimit }}
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
    </div>
  );
}

