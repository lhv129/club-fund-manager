"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";

const OPTIONS = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);

export default function TimeSelect({ label, value, onChange, error, placeholder }: { label: string; value: string; onChange: (value: string) => void; error?: boolean; placeholder?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = value?.slice(0, 5) || "";
    useEffect(() => { const handler = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);
    return <div ref={ref} className="relative w-full"><button type="button" onClick={() => setOpen((current) => !current)} className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-4 text-left text-base dark:bg-neutral-900 ${error ? "border-rose-400" : "border-neutral-200 dark:border-neutral-700"}`}><Clock className="h-4 w-4 text-neutral-400" /><span className={selected ? "text-foreground" : "text-neutral-400"}>{selected || placeholder || label}</span><ChevronDown className={`ml-auto h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-gray-900"><div className="grid grid-cols-4 gap-1">{OPTIONS.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`rounded-lg px-2 py-2 text-sm ${option === selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-background-subtle"}`}>{option}</button>)}</div></div>}</div>;
}
