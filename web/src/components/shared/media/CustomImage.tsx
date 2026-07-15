"use client";

import { useMemo } from "react";
import { API_URL_PUBLIC } from "@/lib/config";

/**
 * Ghép API_URL_PUBLIC với path lưu trong DB (logo, avatar, media...).
 *
 * - src rỗng/null            → null (để component tự render fallback).
 * - src là URL tuyệt đối     → giữ nguyên (http://, https://).
 * - src là blob:/data:       → giữ nguyên (preview local trước khi upload).
 * - src là path tương đối    → ghép với API_URL_PUBLIC (vd: "clubs/logo/abc.png"
 *                              → "http://localhost:8000/clubs/logo/abc.png").
 */
export function resolveImageUrl(src?: string | null): string | null {
    if (!src) return null;

    if (/^(https?:)?\/\//i.test(src) || src.startsWith("blob:") || src.startsWith("data:")) {
        return src;
    }

    const base = API_URL_PUBLIC.replace(/\/+$/, "");
    const path = src.replace(/^\/+/, "");

    return `${base}/${path}`;
}

interface CustomImageProps
    extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
    /** Path lưu trong DB (không phải full URL) hoặc full URL/blob khi preview. */
    src?: string | null;
    /** Hiển thị khi không có src (ví dụ icon placeholder). */
    fallback?: React.ReactNode;
    /** Wrapper class khi render fallback (để căn giữa icon, giữ kích thước…). */
    fallbackClassName?: string;
}

/**
 * <img> có sẵn logic ghép API_URL_PUBLIC — dùng cho mọi nơi đổ ảnh
 * lưu path tương đối (logo, avatar, media...).
 *
 * Dùng thay cho <img src="..."> thô mỗi khi giá trị lấy từ DB (không phải
 * blob preview) để tránh phải tự ghép domain ở từng component.
 */
export default function CustomImage({
    src,
    alt = "",
    fallback = null,
    fallbackClassName,
    className,
    ...rest
}: CustomImageProps) {
    const resolved = useMemo(() => resolveImageUrl(src), [src]);

    if (!resolved) {
        if (!fallback) return null;
        return <div className={fallbackClassName}>{fallback}</div>;
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={alt} className={className} {...rest} />;
}
