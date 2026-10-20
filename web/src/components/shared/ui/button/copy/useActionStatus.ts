"use client";

import { useEffect, useRef, useState } from "react";

export type ActionStatus = "idle" | "busy" | "done" | "error";

/** Shared transient feedback state for standalone UI actions. */
export function useActionStatus() {
    const [status, setCurrentStatus] = useState<ActionStatus>("idle");
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const setStatus = (next: ActionStatus) => {
        clearTimeout(timer.current);
        setCurrentStatus(next);

        if (next === "done" || next === "error") {
            timer.current = setTimeout(() => setCurrentStatus("idle"), 2000);
        }
    };

    return { status, setStatus };
}
