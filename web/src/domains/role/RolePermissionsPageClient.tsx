// ══════════════════════════════════════════════════════════════════
// 3. @/domains/role/components/RolePermissionsPageClient.tsx
// ══════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
    ArrowLeft,
    Check,
    CheckSquare,
    Loader2,
    RotateCcw,
    Save,
    Search,
    Shield,
    ShieldCheck,
    Square,
} from "lucide-react";

import { useRolePermissions } from "@/domains/role/hooks/useRolePermissions";
import type { RolePermission, RolePermissionAction } from "@/domains/role/types";
import { APP_ROUTES } from "@/constants";

/* ============================================================
   TYPES
============================================================ */
interface Props {
    slug: string;
}

/* ============================================================
   CONSTANTS
============================================================ */
const GLOBAL_ACTIONS = ["view_all", "update_all", "delete_all"];

/* ============================================================
   ACTION CHIP
============================================================ */
interface ActionChipProps {
    action: RolePermissionAction;
    label: string;
    onToggle: (id: number) => void;
    amber?: boolean;
}

function ActionChip({ action, label, onToggle, amber }: ActionChipProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(action.id)}
            className={[
                "group flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all",
                action.checked
                    ? amber
                        ? "bg-warning/10 text-warning ring-1 ring-warning/30"
                        : "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "bg-background-subtle text-foreground-muted hover:bg-background-muted",
            ].join(" ")}
        >
            <span
                className={[
                    "w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors",
                    action.checked
                        ? amber ? "bg-warning border-warning" : "bg-primary border-primary"
                        : "border-border bg-background",
                ].join(" ")}
            >
                {action.checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </span>
            {label}
        </button>
    );
}

/* ============================================================
   MODULE CARD
============================================================ */
interface ModuleCardProps {
    module: RolePermission;
    actionLabel: (name: string) => string;
    onToggle: (id: number) => void;
    onToggleAll: (moduleName: string, checked: boolean) => void;
    onToggleGroup: (moduleName: string, names: string[], checked: boolean) => void;
    labelSelectAll: string;
    labelDeselectAll: string;
    labelRegular: string;
    labelAdmin: string;
    labelProgress: (checked: number, total: number) => string;
}

function ModuleCard({
    module,
    actionLabel,
    onToggle,
    onToggleAll,
    onToggleGroup,
    labelSelectAll,
    labelDeselectAll,
    labelRegular,
    labelAdmin,
    labelProgress,
}: ModuleCardProps) {
    const regularActions = module.actions.filter((a) => !GLOBAL_ACTIONS.includes(a.name));
    const globalActions = module.actions.filter((a) => GLOBAL_ACTIONS.includes(a.name));
    const hasGlobal = globalActions.length > 0;
    const allChecked = module.actions.every((a) => a.checked);
    const checkedCount = module.actions.filter((a) => a.checked).length;
    const total = module.actions.length;
    const progress = total > 0 ? (checkedCount / total) * 100 : 0;
    const allRegularChecked = regularActions.every((a) => a.checked);
    const allOwnerChecked = globalActions.length > 0 && globalActions.every((a) => a.checked);

    return (
        <div className={["rounded-2xl border bg-background overflow-hidden transition-shadow hover:shadow-md", hasGlobal ? "border-warning/30" : "border-border"].join(" ")}>
            <div className={["h-1 w-full", hasGlobal ? "bg-gradient-to-r from-warning to-orange-400" : "bg-primary"].join(" ")} />

            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={["w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", hasGlobal ? "bg-warning/10" : "bg-primary/10"].join(" ")}>
                            {hasGlobal ? <ShieldCheck className="w-4 h-4 text-warning" /> : <Shield className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{module.label}</span>
                                {hasGlobal && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase tracking-wide flex-shrink-0">
                                        Owner
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] font-mono text-foreground-muted">{module.module}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onToggleAll(module.module, !allChecked)}
                        className={["flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors", allChecked ? "bg-background-subtle text-foreground-muted hover:bg-background-muted" : "bg-primary/5 text-primary hover:bg-primary/10"].join(" ")}
                    >
                        {allChecked ? labelDeselectAll : labelSelectAll}
                    </button>
                </div>

                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-foreground-muted">{labelProgress(checkedCount, total)}</span>
                        <span className="text-[11px] font-semibold text-foreground-muted">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-background-subtle overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            <div className="px-4 pb-3">
                {hasGlobal && (
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">{labelRegular}</p>
                        <button type="button" onClick={() => onToggleGroup(module.module, regularActions.map((a) => a.name), !allRegularChecked)}
                            className="text-[10px] text-primary hover:opacity-75 font-semibold transition-opacity">
                            {allRegularChecked ? labelDeselectAll : labelSelectAll}
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                    {regularActions.map((action) => (
                        <ActionChip key={action.id} action={action} label={actionLabel(action.name)} onToggle={onToggle} />
                    ))}
                </div>
            </div>

            {hasGlobal && globalActions.length > 0 && (
                <div className="mx-4 mb-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-warning uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />{labelAdmin}
                        </p>
                        <button type="button" onClick={() => onToggleGroup(module.module, globalActions.map((a) => a.name), !allOwnerChecked)}
                            className="text-[10px] text-warning hover:opacity-75 font-semibold transition-opacity">
                            {allOwnerChecked ? labelDeselectAll : labelSelectAll}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        {globalActions.map((action) => (
                            <ActionChip key={action.id} action={action} label={actionLabel(action.name)} onToggle={onToggle} amber />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   PAGE
============================================================ */
export function RolePermissionsPageClient({ slug }: Props) {
    const t = useTranslations("common");
    const tr = useTranslations("role");
    const router = useRouter();

    // ── Cache hook — toàn bộ data + toggle logic ──────────────────────────────
    const {
        permissions,
        isLoading,
        isSyncing,
        hasChanged,
        currentCheckedIds,
        togglePermission,
        toggleModule,
        toggleGroup,
        handleSelectAll,
        handleDeselectAll,
        handleReset,
        handleSync,
    } = useRolePermissions(slug);

    // ── UI state (chỉ liên quan render) ──────────────────────────────────────
    const [search, setSearch] = useState("");

    // ── Derived state ─────────────────────────────────────────────────────────
    const filteredPermissions = useMemo(() => {
        if (!search.trim()) return permissions;
        const q = search.toLowerCase();
        return permissions.filter(
            (m) => m.label.toLowerCase().includes(q) || m.module.toLowerCase().includes(q)
        );
    }, [permissions, search]);

    const totalChecked = currentCheckedIds.length;
    const totalActions = permissions.reduce((sum, m) => sum + m.actions.length, 0);
    const allGlobalChecked = totalChecked === totalActions && totalActions > 0;

    // ── i18n helper ───────────────────────────────────────────────────────────
    const getActionLabel = (name: string): string => {
        const key = `action_${name}` as Parameters<typeof tr>[0];
        try { return tr(key); } catch { return name; }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-24">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.push(APP_ROUTES.adminRoles)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border
                            border-border text-foreground-muted hover:bg-background-subtle transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">{tr("permissionsTitle")}</h1>
                        <p className="mt-1 text-sm text-foreground-muted">
                            {tr("roleLabel")}:{" "}
                            <span className="font-mono font-medium text-foreground">{slug}</span>
                        </p>
                    </div>
                </div>

                {hasChanged && (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleReset} disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-xl border border-border
                                bg-background px-3.5 py-2 text-sm font-medium text-foreground-muted
                                hover:bg-background-subtle disabled:opacity-60 transition-colors">
                            <RotateCcw className="h-4 w-4" />{tr("undo")}
                        </button>
                        <button type="button" onClick={handleSync} disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2
                                text-sm font-semibold text-primary-foreground hover:bg-primary-hover
                                disabled:opacity-60 transition-colors shadow-sm">
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {tr("saveChanges")}
                        </button>
                    </div>
                )}
            </div>

            {/* Stats bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs font-semibold text-primary">
                            {tr("checkedSummary", { checked: totalChecked, total: totalActions })}
                        </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-background-subtle">
                        <span className="text-xs font-medium text-foreground-muted">
                            {tr("moduleCount", { count: permissions.length })}
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-background-subtle overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: totalActions > 0 ? `${(totalChecked / totalActions) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-xs text-foreground-muted">
                            {totalActions > 0 ? Math.round((totalChecked / totalActions) * 100) : 0}%
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder={tr("searchPlaceholder")}
                            className="pl-8 pr-3 py-2 text-xs rounded-xl border border-border
                                bg-background text-foreground placeholder:text-foreground-muted
                                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                w-36 sm:w-44 transition-all" />
                    </div>
                    <button type="button" onClick={allGlobalChecked ? handleDeselectAll : handleSelectAll}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                            border border-border bg-background text-foreground-muted hover:bg-background-subtle transition-colors">
                        {allGlobalChecked
                            ? <><Square className="w-3.5 h-3.5" />{tr("deselectAllGlobal")}</>
                            : <><CheckSquare className="w-3.5 h-3.5" />{tr("selectAllGlobal")}</>}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-sm text-foreground-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    {tr("loadingPermissions")}
                </div>
            ) : filteredPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-foreground-muted">
                    <Shield className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">{search ? tr("notFoundSearch") : tr("noPermissionsData")}</p>
                    {search && (
                        <button type="button" onClick={() => setSearch("")}
                            className="mt-2 text-xs text-primary hover:underline">
                            {tr("clearFilter")}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPermissions.map((module) => (
                        <ModuleCard
                            key={module.module}
                            module={module}
                            actionLabel={getActionLabel}
                            onToggle={togglePermission}
                            onToggleAll={toggleModule}
                            onToggleGroup={toggleGroup}
                            labelSelectAll={tr("selectAll")}
                            labelDeselectAll={tr("deselectAll")}
                            labelRegular={tr("regularActions")}
                            labelAdmin={tr("adminActions")}
                            labelProgress={(checked, total) => tr("progressLabel", { checked, total })}
                        />
                    ))}
                </div>
            )}

            {/* Sticky bottom save bar */}
            {hasChanged && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3
                    px-5 py-3 rounded-2xl bg-background border border-border shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                        <span className="text-xs font-medium text-foreground-muted whitespace-nowrap">
                            {tr("unsavedChanges")}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <button type="button" onClick={handleReset} disabled={isSyncing}
                        className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50">
                        {tr("undo")}
                    </button>
                    <button type="button" onClick={handleSync} disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl
                            bg-primary hover:bg-primary-hover text-primary-foreground
                            text-xs font-semibold transition-colors disabled:opacity-60">
                        {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {tr("saveChanges")}
                    </button>
                </div>
            )}
        </div>
    );
}