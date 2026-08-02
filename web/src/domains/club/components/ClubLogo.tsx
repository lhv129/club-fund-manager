import CustomImage from "@/components/shared/media/CustomImage";


interface ClubLogoProps {
    src?: string | null;
    name: string;
    size?: "sm" | "md" | "lg";
}

const sizeMap = {
    sm: { wrap: "w-9 h-9", text: "text-xs font-semibold" },
    md: { wrap: "w-11 h-11", text: "text-sm font-semibold" },
    lg: { wrap: "w-14 h-14", text: "text-base font-bold" },
};

/** Avatar logo CLB — ảnh nếu có, fallback 2 chữ cái màu tự sinh từ tên */
export function ClubLogo({ src, name, size = "md" }: ClubLogoProps) {
    const { wrap, text } = sizeMap[size];

    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");

    // Deterministic hue từ tên CLB — cùng tên luôn ra cùng màu
    const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

    if (src) {
        return (
            <div className={`${wrap} rounded-xl overflow-hidden shrink-0 ring-1 ring-black/8 dark:ring-white/10`}>
                <CustomImage src={src} alt={name} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div
            className={`${wrap} ${text} rounded-xl shrink-0 flex items-center justify-center
        ring-1 ring-black/8 dark:ring-white/10 select-none tracking-wide`}
            style={{
                background: `hsl(${hue} 50% 91%)`,
                color: `hsl(${hue} 55% 30%)`,
            }}
            aria-label={name}
        >
            {initials || "?"}
        </div>
    );
}
