export function TableActionItem({
    icon,
    label,
    onClick,
    variant = "default",
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger" | "success";
}) {
    const color =
        variant === "danger"
            ? "text-rose-600 hover:bg-rose-50"
            : variant === "success"
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-gray-700 hover:bg-gray-50";

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 text-sm w-full ${color} dark:hover:bg-gray-800`}
        >
            {icon}
            {label}
        </button>
    );
}