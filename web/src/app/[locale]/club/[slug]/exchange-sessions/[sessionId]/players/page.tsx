import { setRequestLocale } from "next-intl/server";import { ExchangeSessionPlayersPageClient } from "@/domains/exchangeSession/ExchangeSessionPlayersPageClient";
export default async function Page({params}:{params:Promise<{locale:string;slug:string;sessionId:string}>}){const{locale}=await params;setRequestLocale(locale);return <ExchangeSessionPlayersPageClient/>}
