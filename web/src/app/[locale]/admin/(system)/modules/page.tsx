import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ModulesPageClient } from "@/domains/module/ModulesPageClient";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const t = await getTranslations({
        locale,
        namespace: "metadata.modules",
    });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function AdminModulesPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ModulesPageClient />;
}
