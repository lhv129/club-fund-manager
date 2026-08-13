"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

const MENU_WIDTH = 176;
const MENU_GAP = 8;

type MenuPosition = {
    top: number;
    left: number;
    visibility: "hidden" | "visible";
};

export function TableActions({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<MenuPosition>({
        top: 0,
        left: 0,
        visibility: "hidden",
    });

    const updatePosition = () => {
        const trigger = triggerRef.current;
        const menu = menuRef.current;
        if (!trigger || !menu) return;

        const triggerRect = trigger.getBoundingClientRect();
        const menuHeight = menu.offsetHeight;
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const openUp = spaceBelow < menuHeight + MENU_GAP && triggerRect.top > menuHeight;

        setPosition({
            top: openUp
                ? Math.max(MENU_GAP, triggerRect.top - menuHeight - MENU_GAP)
                : Math.min(triggerRect.bottom + MENU_GAP, window.innerHeight - menuHeight - MENU_GAP),
            left: Math.min(
                Math.max(MENU_GAP, triggerRect.right - MENU_WIDTH),
                window.innerWidth - MENU_WIDTH - MENU_GAP,
            ),
            visibility: "visible",
        });
    };

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                !triggerRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) return;

        const close = () => setOpen(false);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);

        return () => {
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={triggerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className="fixed z-[100] w-44 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                    style={position}
                    onClick={() => setOpen(false)}
                >
                    {children}
                </div>,
                document.body,
            )}
        </div>
    );
}
