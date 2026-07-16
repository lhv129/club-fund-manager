"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import CustomImage from "@/components/shared/media/CustomImage";

export interface MediaImageState {
    file: File | null;
    preview: string | null;
    removed: boolean;
}

interface Props {
    initialUrl?: string | null;
    errors?: string[];
    onChange: (state: MediaImageState) => void;
}

const MediaImage: FC<Props> = ({
    initialUrl = null,
    errors = [],
    onChange,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialUrl);
    const [removed, setRemoved] = useState(false);

    useEffect(() => {
        setFile(null);
        setPreview(initialUrl);
        setRemoved(false);
    }, [initialUrl]);

    useEffect(() => {
        onChange({
            file,
            preview,
            removed,
        });
    }, [file, preview, removed]);

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        const url = URL.createObjectURL(f);

        setFile(f);
        setPreview(url);
        setRemoved(false);

        e.target.value = "";
    };

    const onRemove = () => {
        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setFile(null);
        setPreview(null);
        setRemoved(true);
    };

    const hasImage = Boolean(preview && !removed);

    return (
        <div className="space-y-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPick}
            />

            <div
                className={`group relative w-32 h-32 rounded-xl overflow-hidden border bg-neutral-100 dark:bg-neutral-800 ${errors.length
                    ? "border-rose-400 dark:border-rose-500"
                    : "border-gray-200 dark:border-gray-700"
                    }`}
            >
                {hasImage ? (
                    <CustomImage
                        src={preview ?? ""}
                        className="w-full h-full object-cover"
                        alt=""
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                        <PhotoIcon className="w-8 h-8" />
                        <span className="text-xs font-medium">Chọn ảnh</span>
                    </button>
                )}

                {hasImage && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/45 transition-all duration-200">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="p-2 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-sm transition-colors"
                            title="Đổi ảnh"
                        >
                            <PhotoIcon className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={onRemove}
                            className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-colors"
                            title="Xóa ảnh"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {errors.map((e, i) => (
                <p key={i} className="text-xs text-rose-500">
                    {e}
                </p>
            ))}
        </div>
    );
};

export default MediaImage;

export function appendMediaImagePayload(
    payload: FormData,
    fieldName: string,
    state?: MediaImageState
): void {
    if (!state) return;

    if (state.file) {
        payload.append(fieldName, state.file);
        return;
    }

    if (state.removed) {
        payload.append(fieldName, "");
    }
}

export function buildThumbnailPayload(
    payload: FormData,
    state: MediaImageState
): void {
    appendMediaImagePayload(payload, "thumbnail", state);
}