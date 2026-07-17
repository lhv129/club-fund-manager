import { RolePermissionsPageClient } from "@/domains/role/RolePermissionsPageClient";

export default async function RolePermissionsPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { slug } = await params;

    return <RolePermissionsPageClient slug={slug} />;
}
