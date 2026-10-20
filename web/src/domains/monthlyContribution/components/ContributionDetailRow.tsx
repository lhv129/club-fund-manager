"use client";

import type { ReactNode } from "react";
import { DetailRow } from "@/components/shared/ui/DetailRow";

interface ContributionDetailRowProps {
    label: string;
    value: ReactNode;
    mono?: boolean;
    prominent?: boolean;
}

/** Compatibility wrapper; new detail pages can import shared DetailRow directly. */
export function ContributionDetailRow({
    label,
    value,
    mono = false,
    prominent = false,
}: ContributionDetailRowProps) {
    return (
        <DetailRow
            label={label}
            value={value}
            mono={mono}
            prominent={prominent}
        />
    );
}