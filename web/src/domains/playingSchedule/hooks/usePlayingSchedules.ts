"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { getPlayingScheduleService } from "../services/playingScheduleService";
import type { PlayingSchedule, PlayingScheduleFilters } from "../types";
import type { useListParams } from "@/hooks/useListParams";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { ServerErrorResponse, SubmitResult, TranslationEntry } from "@/components/shared/forms/FormModal";

function serverError(error: unknown): ServerErrorResponse | null { const data = (error as { response?: { data?: ServerErrorResponse } })?.response?.data; return data ?? (error && typeof error === "object" && "success" in error && (error as ServerErrorResponse).success === false ? error as ServerErrorResponse : null); }
function payload(values: Record<string, string>, translations?: TranslationEntry[]) { const fd = new FormData(); ["weekday","court_name","court_address","start_time","end_time","weeks_ahead","sort_order"].forEach((key) => fd.append(key, values[key] ?? "")); ["auto_generate","is_active"].forEach((key) => fd.append(key, values[key] === "1" || values[key] === "true" ? "1" : "0")); (translations ?? []).forEach((entry) => { const e = entry as Record<string,string>; fd.append(`translations[${entry.locale}][title]`, e.title ?? ""); fd.append(`translations[${entry.locale}][note]`, e.note ?? ""); }); return fd; }

export function usePlayingSchedules(slug: string, params: ReturnType<typeof useListParams<PlayingScheduleFilters>>["params"]) {
    const service = getPlayingScheduleService(slug); const t = useTranslations("common"); const qc = useQueryClient(); const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set()); const key = ["playing-schedules", slug, params] as const;
    const query = useQuery({ queryKey: key, queryFn: () => service.list(params) as Promise<PaginatedResponse<PlayingSchedule>>, enabled: Boolean(slug) });
    const create = useMutation({ mutationFn: (x: FormData) => service.create(x) }); const update = useMutation({ mutationFn: (x: {id:number; payload:FormData}) => service.update(x.id,x.payload) });
    const remove = useMutation({ mutationFn: (id:number) => service.destroy(id), onSuccess: (_, id) => { qc.setQueryData<PaginatedResponse<PlayingSchedule>>(key, old => old ? {...old,data:(old.data??[]).filter(x=>x.id!==id),meta:{...old.meta,total:Math.max(0,(old.meta?.total??1)-1)}}:old); toast.success(t("deleteSuccess")); } });
    const toggle = useMutation({ mutationFn: (id:number) => service.toggleStatus(id) as Promise<ApiResponse<PlayingSchedule>>, onSuccess:(res,id)=>{ if(!res.success){toast.error(res.message||t("loadError"));return;} qc.setQueryData<PaginatedResponse<PlayingSchedule>>(key,old=>old?{...old,data:(old.data??[]).map(x=>x.id===id?{...x,...(res.data??{}),is_active:res.data?.is_active??!x.is_active}:x)}:old); toast.success(res.message||t("updateStatus")); }, onError:(e:unknown)=>toast.error((e as Error)?.message||t("loadError")) });
    const submit = async (run:()=>Promise<unknown>, msg:string):Promise<SubmitResult> => { try { const res=await run() as ApiResponse<PlayingSchedule>; if(!res.success)return {success:false,message:res.message,errors:res.errors}; await qc.invalidateQueries({queryKey:["playing-schedules",slug]}); toast.success(res.message||t(msg)); return; } catch(e){ const x=serverError(e); if(x)return x; toast.error((e as Error)?.message||t("loadError")); return {success:false}; } };
    return { data:query.data?.data??[], total:query.data?.meta?.total??0, isLoading:query.isLoading, isCreating:create.isPending,isUpdating:update.isPending,isDeleting:remove.isPending,togglingIds, handleCreate:(v:Record<string,string>,tr?:TranslationEntry[])=>submit(()=>create.mutateAsync(payload(v,tr)),"saveSuccess"), handleEdit:(id:number,v:Record<string,string>,tr?:TranslationEntry[])=>submit(()=>update.mutateAsync({id,payload:payload(v,tr)}),"updateSuccess"), handleDeleteConfirm:(id:number)=>remove.mutate(id), handleToggleStatus:(id:number)=>{if(togglingIds.has(id))return;setTogglingIds(s=>new Set(s).add(id));toggle.mutate(id,{onSettled:()=>setTogglingIds(s=>{const n=new Set(s);n.delete(id);return n;})});} };
}


