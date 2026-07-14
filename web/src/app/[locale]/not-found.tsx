import { useTranslations } from "next-intl";
import NotFoundView from "@/components/ui/NotFoundView";

export default function NotFound() {
  const t = useTranslations("error");
  return (
    <NotFoundView
      title="404"
      description={t("notFound")}
      href="/dashboard"
      linkLabel={t("backHome")}
    />
  );
}
