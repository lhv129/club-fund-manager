import { setRequestLocale } from "next-intl/server";import { ExchangeSessionsPageClient } from "@/domains/exchangeSession/ExchangeSessionsPageClient";
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}){const{locale}=await params;setRequestLocale(locale);return <ExchangeSessionsPageClient/>}
