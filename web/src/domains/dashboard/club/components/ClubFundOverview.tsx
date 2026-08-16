import { ArrowRight, CircleDollarSign } from "lucide-react";
import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import type { DashboardContribution, DashboardFundPeriod } from "../types";
import { Link } from "@/i18n/routing";
import { formatAmount } from "@/utils";
import { DashboardCard, DashboardState } from "./DashboardCard";

export function ClubFundOverview({ periods, contributions, locale, slug }: { periods: DashboardFundPeriod[]; contributions: DashboardContribution[]; locale: string; slug: string }) {
  const period = periods.find((item) => item.is_active) ?? periods[0];
  const pending = contributions.filter((item) => item.status === "pending" && (!period || item.period_id === period.id));
  return <DashboardCard icon={CircleDollarSign} title={period ? `Kỳ quỹ tháng ${period.month}/${period.year}` : "Kỳ quỹ hiện tại"} description="Dữ liệu trực tiếp từ FundPeriod và MonthlyContribution" action={<Link href={clubRoute(slug, CLUB_SUBROUTES.monthlyContributions)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Chi tiết<ArrowRight className="size-4" /></Link>}>
    {!period ? <DashboardState message="Chưa có kỳ quỹ nào." /> : <div className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)]"><div className="rounded-xl bg-background-subtle p-4"><p className="text-xs text-foreground-muted">Trạng thái kỳ quỹ</p><p className="mt-1 font-semibold text-foreground">{period.is_locked ? "Đã khóa" : period.is_active ? "Đang hoạt động" : "Không hoạt động"}</p><p className="mt-4 text-xs text-foreground-muted">Phí thành viên nam</p><p className="mt-1 font-semibold text-foreground">{formatAmount(period.male_amount, "₫", locale)}</p><p className="mt-3 text-xs text-foreground-muted">Phí thành viên nữ</p><p className="mt-1 font-semibold text-foreground">{formatAmount(period.female_amount, "₫", locale)}</p></div><div><h3 className="text-sm font-semibold text-foreground">Khoản đóng đang chờ trong dữ liệu tải về</h3>{!pending.length ? <p className="mt-4 text-sm text-foreground-muted">Không có khoản đang chờ trong trang dữ liệu hiện tại.</p> : <div className="mt-2 divide-y divide-border">{pending.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{item.user.fullname}</p><p className="text-xs text-foreground-muted">Pending</p></div><span className="text-sm font-semibold text-amber-500">{formatAmount(item.amount, "₫", locale)}</span></div>)}</div>}</div></div>}
  </DashboardCard>;
}
