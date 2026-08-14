import { setRequestLocale } from "next-intl/server";
import { PaymentCodesPageClient } from "@/domains/paymentCode/PaymentCodesPageClient";

export default async function PaymentCodesPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; setRequestLocale(locale); return <PaymentCodesPageClient />; }
