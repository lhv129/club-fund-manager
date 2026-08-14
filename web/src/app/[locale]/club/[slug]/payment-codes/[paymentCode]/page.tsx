import { setRequestLocale } from "next-intl/server";
import { PaymentCodeDetailPageClient } from "@/domains/paymentCode/PaymentCodeDetailPageClient";

export default async function PaymentCodeDetailPage({ params }: { params: Promise<{ locale: string; paymentCode: string }> }) { const { locale, paymentCode } = await params; setRequestLocale(locale); return <PaymentCodeDetailPageClient code={paymentCode} />; }
