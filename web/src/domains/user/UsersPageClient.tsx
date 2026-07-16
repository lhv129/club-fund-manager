// src/app/[locale]/admin/(system)/users/UsersPageClient.tsx
//
// Columns pattern:
//   - StatusDropdown → status enum (active|inactive|locked), click → popup → gọi updateStatus API
//   Module nào chỉ hiển thị status không cần API thì bỏ onChange khỏi StatusDropdown.
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Table, ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import { FormModal, type SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { StatusDropdown, type StatusOption } from "@/components/shared/ui/StatusDropdown";
import Select from "@/components/shared/ui/Select";
import Avatar from "@/components/shared/ui/Avatar";
import { useListParams } from "@/hooks/useListParams";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { userServiceClient } from "@/domains/user/services/userService";
import type { ApiResponse } from "@/types/api";
import type { User, UserFilters, UserStatus } from "@/domains/user/types";

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(iso));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersPageClient() {
  const t = useTranslations("common");
  const tu = useTranslations("user");
  const { hasPermission, isSuperAdmin, user } = useAuth();

  const canCreate = isSuperAdmin || hasPermission("user", "create");
  const canUpdate = isSuperAdmin || hasPermission("user", "update");
  const canDelete = isSuperAdmin || hasPermission("user", "delete");

  // ─── Options ────────────────────────────────────────────────────────────────

  // StatusDropdown options — i18n nên phải trong component
  const statusOptions: StatusOption[] = [
    { value: "active", label: tu("statusActive"), variant: "active" },
    { value: "inactive", label: tu("statusInactive"), variant: "inactive" },
    { value: "locked", label: tu("statusLocked"), variant: "locked" },
  ];

  // Select options cho FilterBar extraFilters (value là string)
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

  // ─── List params ─────────────────────────────────────────────────────────────
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

  // ─── State ───────────────────────────────────────────────────────────────────
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<number>>(new Set());

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await userServiceClient.list(params);
      if (res.success) {
        setData(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
      }
    } catch (error: any) {
      toast.error(error?.message || t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── FilterBar ───────────────────────────────────────────────────────────────
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

  // ─── Form modal ──────────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row: User) => { setEditing(row); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: Record<string, string>): Promise<SubmitResult> => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== "") formData.append(k, v); });

      const raw = editing
        ? await userServiceClient.update(editing.id, formData)
        : await userServiceClient.create(formData);
      const res = raw as unknown as ApiResponse<User>;

      if (!res.success) return { success: false, message: res.message, errors: res.errors };

      const saved = res.data;
      if (saved) {
        if (editing) {
          setData((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        } else {
          setData((prev) => [saved, ...prev]);
          setTotal((prev) => prev + 1);
        }
      } else {
        await fetchData();
      }
      toast.success(res.message || t("saveSuccess"));
      closeModal();
    } catch (error: any) {
      toast.error(error?.message || t("loadError"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Cập nhật status enum (StatusDropdown) ───────────────────────────────────
  const handleStatusChange = async (row: User, newStatus: string) => {
    if (updatingStatusIds.has(row.id)) return;
    setUpdatingStatusIds((prev) => new Set(prev).add(row.id));
    try {
      const res = await (userServiceClient as any).updateStatus(row.id, newStatus);
      if (res.success && res.data) {
        setData((prev) => prev.map((item) => (item.id === row.id ? res.data! : item)));
        toast.success(res.message || t("updateStatus"));
      }
    } catch (error: any) {
      toast.error(error?.message || t("loadError"));
    } finally {
      setUpdatingStatusIds((prev) => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await userServiceClient.destroy(deleteTarget.id, params);
      if (res.success) {
        setData(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
        toast.success(res.message || t("deleteSuccess"));
        setDeleteTarget(null);
      }
    } catch (error: any) {
      toast.error(error?.message || t("loadError"));
    } finally {
      setDeleting(false);
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<User>[] = [
    {
      key: "stt", label: t("no"), className: "w-12",
      render: (_row, index) => (
        <span className="text-fg-muted text-xs">{(params.page - 1) * params.limit + index + 1}</span>
      ),
    },

    // Avatar
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

    // Họ tên + email
    {
      key: "fullname", label: t("name"),
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-fg font-medium truncate">{row.fullname}</span>
          <span className="text-fg-muted text-xs truncate">{row.email}</span>
        </div>
      ),
    },

    // Username
    {
      key: "username", label: tu("username"),
      render: (row) => (
        <span className="font-mono text-xs text-fg-muted bg-gray-100 dark:bg-gray-800
            px-2 py-0.5 rounded-md whitespace-nowrap">
          @{row.username}
        </span>
      ),
    },

    // SĐT
    {
      key: "phone", label: tu("phone"),
      render: (row) => <span className="text-sm text-fg whitespace-nowrap">{row.phone ?? "—"}</span>,
    },

    // Giới tính
    {
      key: "gender", label: tu("gender"),
      render: (row) => <span className="text-sm text-fg">{row.gender ?? "—"}</span>,
    },

    // Ngày sinh
    {
      key: "date_of_birth", label: tu("dateOfBirth"),
      render: (row) => (
        <span className="text-sm text-fg-muted whitespace-nowrap">{formatDate(row.date_of_birth)}</span>
      ),
    },

    // Xác thực email — readonly
    {
      key: "email_verified_at", label: tu("emailVerified"),
      render: (row) => (
        <StatusDropdown
          value={row.email_verified_at ? "verified" : "unverified"}
          options={[
            { value: "verified", label: tu("verified"), variant: "active" },
            { value: "unverified", label: tu("unverified"), variant: "inactive" },
          ]}
        />
      ),
    },

    // StatusDropdown — chọn status bất kỳ (PATCH update-status)
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

    // Ngày tạo
    {
      key: "created_at", label: t("createdAt"),
      render: (row) => (
        <span className="text-xs text-fg-muted whitespace-nowrap">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  // ─── extraFilters ─────────────────────────────────────────────────────────────
  const extraFilters = (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tu("status")}</span>
        <Select
          label={tu("status")}
          options={statusSelectOptions}
          value={draftStatus ?? ""}
          onChange={(v) => setDraftStatus((v || undefined) as UserStatus | undefined)}
          placeholder={t("all")}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tu("emailVerified")}</span>
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

  // ─── Form fields ──────────────────────────────────────────────────────────────
  //
  // Các field dùng chung cho cả create & edit
  const baseFields = [
    {
      name: "first_name",
      label: tu("firstName"),
      type: "text" as const,
      placeholder: tu("firstNamePlaceholder"),
    },
    {
      name: "last_name",
      label: tu("lastName"),
      type: "text" as const,
      placeholder: tu("lastNamePlaceholder"),
    },
    {
      name: "username",
      label: tu("username"),
      type: "text" as const,
      required: true,
      placeholder: tu("usernamePlaceholder"),
    },
    {
      name: "email",
      label: t("email"),
      type: "email" as const,
      required: true,
      placeholder: tu("emailPlaceholder"),
    },
    {
      name: "phone",
      label: tu("phone"),
      type: "text" as const,
      placeholder: tu("phonePlaceholder"),
    },
    {
      name: "address",
      label: tu("address"),
      type: "text" as const,
      placeholder: tu("addressPlaceholder"),
    },
    {
      name: "date_of_birth",
      label: tu("dateOfBirth"),
      type: "datepicker" as const,
    },
    {
      name: "gender",
      label: tu("gender"),
      type: "select" as const,
      options: genderOptions,
      placeholder: tu("genderPlaceholder"),
    },
    {
      name: "status",
      label: t("status"),
      type: "select" as const,
      required: true,
      options: statusSelectOptions,
      placeholder: tu("statusPlaceholder"),
    },
  ];

  // Field password — chỉ xuất hiện khi tạo mới, không hiển thị khi chỉnh sửa
  const createOnlyFields = [
    {
      name: "password",
      label: tu("password"),
      type: "password" as const,
      required: true,
      placeholder: tu("passwordPlaceholder"),
    },
  ];

  const formFields = editing ? baseFields : [...baseFields, ...createOnlyFields];

  // ─── Initial values ───────────────────────────────────────────────────────────
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
    // password chỉ có trong form create — khi edit không cần truyền
    ...(!editing && { password: "" }),
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

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
          search={params.search}
          sortBy={params.sort_by}
          sortDir={params.sort_dir}
          sortOptions={sortOptions}
          showStatusFilter={false}
          loading={loading}
          onApply={handleApply}
          onReset={handleReset}
          extraFilters={extraFilters}
        />

        <Table
          columns={columns}
          data={data}
          loading={loading}
          keyExtractor={(row) => row.id}
          renderActions={(row) => (
            <TableActions>
              {canUpdate && (
                <TableActionItem
                  icon={<Pencil className="w-4 h-4" />}
                  label={t("edit")}
                  onClick={() => openEdit(row)}
                />
              )}
              {canDelete && row.id !== user?.id && (
                <TableActionItem
                  icon={<Trash2 className="w-4 h-4" />}
                  label={t("delete")}
                  variant="danger"
                  onClick={() => setDeleteTarget(row)}
                />
              )}
            </TableActions>
          )}
          emptyText={tu("notFound")}
        />

        <Pagination
          page={params.page}
          limit={params.limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <FormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        title={editing ? tu("edit") : tu("create")}
        isEdit={!!editing}
        submitting={submitting}
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
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
