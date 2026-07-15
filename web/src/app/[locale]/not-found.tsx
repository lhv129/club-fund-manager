import { useTranslations } from "next-intl";
import NotFoundView from "@/components/shared/ui/NotFoundView";

export default function NotFound() {
  const t = useTranslations("error");
  return (
    <NotFoundView
      title="404"
      description={t("notFound")}
      href="/"
      linkLabel={t("backHome")}
    />
  );
}
