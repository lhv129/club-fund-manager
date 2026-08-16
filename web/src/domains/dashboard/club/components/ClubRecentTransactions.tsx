import { ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote } from "lucide-react";
import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import type { DashboardTransaction } from "../types";
import { Link } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";
import { DashboardCard, DashboardState } from "./DashboardCard";

export function ClubRecentTransactions({ data, slug, locale }: { data: DashboardTransaction[]; slug: string; locale: string }) {
  return <DashboardCard icon={Banknote} title="Giao dịch gần đây" description="Giao dịch thu, chi mới nhất của câu lạc bộ" action={<Link href={clubRoute(slug, CLUB_SUBROUTES.transactions)} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">Xem tất cả<ArrowRight className="size-4" /></Link>}>
    {!data.length ? <DashboardState message="Chưa có giao dịch nào." /> : <div className="divide-y divide-border px-4 sm:px-5">{data.map((transaction) => { const income = transaction.type === "income"; return <article key={transaction.id} className="flex items-center gap-3 py-3.5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${income ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{income ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{transaction.sender_name || transaction.description || transaction.reference_code || "Giao dịch"}</p><p className="truncate text-xs text-foreground-muted">{transaction.description || "Không có mô tả"} · {transaction.source || "—"}</p><p className="mt-0.5 text-[11px] text-foreground-muted">{formatDateTime(transaction.transaction_date, locale)}</p></div><span className={`whitespace-nowrap text-sm font-semibold ${income ? "text-emerald-500" : "text-red-500"}`}>{income ? "+" : "-"}{formatAmount(transaction.amount, "₫", locale)}</span></article>; })}</div>}
  </DashboardCard>;
}
