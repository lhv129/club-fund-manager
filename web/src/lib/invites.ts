/**
 * Build join link từ invite_code + club slug.
 * Dùng ở: ClubInvitesPageClient, SidebarCopyJoinLinkButton
 */
export function buildJoinLink(
    locale: string,
    clubSlug: string,
    inviteCode: string,
): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${locale}/club/${clubSlug}/join?invite-code=${inviteCode}`;
}