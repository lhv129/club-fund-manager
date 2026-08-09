import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlayingSchedulesPageClient } from "@/domains/playingSchedule/PlayingSchedulesPageClient";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({params}:Props):Promise<Metadata>{const {locale}=await params;const t=await getTranslations({locale,namespace:"metadata.playingSchedules"});return {title:t("title"),description:t("description")};}
export default async function Page({params}:Props){const {locale}=await params;setRequestLocale(locale);return <PlayingSchedulesPageClient/>;}
