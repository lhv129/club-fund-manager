import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export function TableActions({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50">
                    {children}
                </div>
            )}
        </div>
    );
}