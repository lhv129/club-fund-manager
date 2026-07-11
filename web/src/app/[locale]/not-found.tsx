import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-zinc-300">404</h1>
      <p className="text-lg text-zinc-500">{t("notFound")}</p>
    </div>
  );
}
