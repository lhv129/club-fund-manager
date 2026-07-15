import React, { FC } from "react";
import CustomImage from "@/components/shared/media/CustomImage";

// Bảng màu nền khi không có avatar
const avatarColors = [
    "#ffdd00", "#fbb034", "#ff4c4c", "#c1d82f",
    "#00bcd4", "#2196f3", "#9c27b0", "#ff5722",
];

export interface AvatarProps {
    containerClassName?: string;
    sizeClass?: string;
    radius?: string;
    /** Path lưu trong DB, full URL, blob:, hoặc null → hiển thị chữ cái */
    imgUrl?: string | null;
    userName?: string;
    hasChecked?: boolean;
    hasCheckedClass?: string;
}

const Avatar: FC<AvatarProps> = ({
    containerClassName = "ring-1 ring-white dark:ring-neutral-900",
    sizeClass = "h-6 w-6 text-sm",
    radius = "rounded-full",
    imgUrl,
    userName,
    hasChecked,
    hasCheckedClass = "w-4 h-4 -top-0.5 -right-0.5",
}) => {
    const name = userName || "User";

    const bgColor = avatarColors[name.charCodeAt(0) % avatarColors.length];

    return (
        <div
            className={`relative flex-shrink-0 inline-flex items-center justify-center text-white uppercase font-semibold shadow-inner ${radius} ${sizeClass} ${containerClassName}`}
            style={{ backgroundColor: imgUrl ? undefined : bgColor }}
        >
            {imgUrl ? (
                <CustomImage
                    src={imgUrl}
                    alt={name}
                    className={`absolute inset-0 w-full h-full object-cover ${radius}`}
                />
            ) : (
                <span className="select-none leading-none">{name[0]}</span>
            )}

            {hasChecked && (
                <span
                    className={`absolute bg-teal-500 rounded-full text-white text-xs flex items-center justify-center ${hasCheckedClass}`}
                >
                    <i className="las la-check" />
                </span>
            )}
        </div>
    );
};

export default Avatar;