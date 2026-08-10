"use client";

import {
    Breadcrumb,
    type BreadcrumbSegment,
} from "@/components/shared/layout/Breadcrumb";
import { clubRoute } from "@/constants";

import { CLUB_NAV_ITEMS } from "./club-nav-config";

interface ClubBreadcrumbProps {
    slug: string;
    extraItems?: BreadcrumbSegment[];
}

export function ClubBreadcrumb({ slug, extraItems }: ClubBreadcrumbProps) {
    return (
        <Breadcrumb
            navItems={CLUB_NAV_ITEMS(slug)}
            homeHref={clubRoute(slug)}
            extraItems={extraItems}
        />
    );
}
