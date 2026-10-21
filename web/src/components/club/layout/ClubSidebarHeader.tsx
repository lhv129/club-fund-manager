"use client";

import { memo } from "react";
import { X } from "lucide-react";

import { useClub } from "@/domains/club/hooks/useClub";
import ClubContextCard from "./ClubContextCard";

interface ClubSidebarHeaderProps {
    club: ReturnType<typeof useClub>["club"];
    currentLocale: string;
    isSuperAdmin: boolean;
    isSystemAdmin: boolean;
    onClose: () => void;
}

export const ClubSidebarHeader = memo(function ClubSidebarHeader({
    club,
    currentLocale,
    isSuperAdmin,
    isSystemAdmin,
    onClose,
}: ClubSidebarHeaderProps) {
    return (
        <header className="h-16 flex items-center gap-2.5 px-4 lg:px-6 border-b border-border shrink-0">
            <ClubContextCard
                club={club}
                currentLocale={currentLocale}
                isSuperAdmin={isSuperAdmin}
                isSystemAdmin={isSystemAdmin}
            />

            <button
                type="button"
                aria-label="Close sidebar"
                onClick={onClose}
                className="lg:hidden shrink-0 rounded-lg p-1.5 text-foreground-muted transition-all duration-200 hover:bg-background-muted hover:text-foreground hover:rotate-90"
            >
                <X className="h-4 w-4" />
            </button>
        </header>
    );
});