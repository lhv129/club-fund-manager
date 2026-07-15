"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface MediaItem {
    id: number;
    path: string;
}

export interface MediaUploaderState {
    visibleExisting: MediaItem[];
    removedIds: number[];
    newFiles: File[];
    newPreviews: string[];
}

interface Props {
    existingMedia?: MediaItem[];
    maxFiles: number;
    errors?: string[];
    onChange: (state: MediaUploaderState) => void;
}

const MediaUploader: FC<Props> = ({
    existingMedia = [],
    maxFiles,
    errors = [],
    onChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [removedIds, setRemovedIds] = useState<number[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    const visibleExisting = existingMedia.filter((m) => !removedIds.includes(m.id));
    const totalCount = visibleExisting.length + newFiles.length;
    const remaining = maxFiles - totalCount;

    useEffect(() => {
        onChange({ visibleExisting, removedIds, newFiles, newPreviews });
    }, [removedIds, newFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        if (!picked.length) return;

        const allowed = picked.slice(0, remaining);
        setNewFiles((prev) => [...prev, ...allowed]);
        setNewPreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
        e.target.value = "";
    };

    const removeExisting = (id: number) => {
        setRemovedIds((prev) => [...prev, id]);
    };

    const removeNew = (idx: number) => {
        URL.revokeObjectURL(newPreviews[idx]);
        setNewFiles((prev) => prev.filter((_, i) => i !== idx));
        setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-3">
            {/* Ảnh hiện tại */}
            {visibleExisting.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Ảnh hiện tại
                        {removedIds.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-red-400">
                                ({removedIds.length} sẽ bị xoá khi lưu)
                            </span>
                        )}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {visibleExisting.map((m) => (
                            <div key={m.id} className="relative rounded-lg overflow-hidden aspect-square group">
                                <img src={m.path} className="w-full h-full object-cover" alt="" />
                                <button
                                    type="button"
                                    onClick={() => removeExisting(m.id)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                                >
                                    <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                        <TrashIcon className="w-4 h-4" />
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ảnh mới đã chọn */}
            {newFiles.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Ảnh mới ({newFiles.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {newPreviews.map((src, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden aspect-square group">
                                <img src={src} className="w-full h-full object-cover" alt="" />
                                <button
                                    type="button"
                                    onClick={() => removeNew(idx)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                                >
                                    <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                        <TrashIcon className="w-4 h-4" />
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nút upload */}
            {remaining > 0 && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                    >
                        <PhotoIcon className="w-5 h-5" />
                        Tải ảnh{remaining < maxFiles ? ` (còn ${remaining} ảnh)` : ` (tối đa ${maxFiles})`}
                    </button>
                </>
            )}

            {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-500">{err}</p>
            ))}
        </div>
    );
};

export default MediaUploader;

/**
 * Build FormData media payload:
 *
 * Edit mode:
 *   - Ảnh cũ giữ lại:    media[i][id]=<id>  is_update=0
 *   - Ảnh bị xoá:        media[i][id]=<id>  is_update=1           (không path → BE soft-delete)
 *   - Ảnh mới upload:    media[i][id]=""    is_update=1  path=File
 *
 * Create mode:
 *   - Ảnh mới upload:    media[i][id]=""    is_update=1  path=File
 */
export function buildMediaPayload(
    payload: FormData,
    state: MediaUploaderState,
    isEdit: boolean
): void {
    let index = 0;

    if (isEdit) {
        // Ảnh cũ giữ lại
        state.visibleExisting.forEach((m) => {
            payload.append(`media[${index}][id]`, String(m.id));
            payload.append(`media[${index}][is_update]`, "0");
            index++;
        });

        // Ảnh bị xoá — gửi id + is_update=1, không có path → BE nhận biết để soft-delete
        state.removedIds.forEach((id) => {
            payload.append(`media[${index}][id]`, String(id));
            payload.append(`media[${index}][is_update]`, "1");
            index++;
        });
    }

    // Ảnh mới upload
    state.newFiles.forEach((file) => {
        payload.append(`media[${index}][id]`, "");
        payload.append(`media[${index}][is_update]`, "1");
        payload.append(`media[${index}][path]`, file);
        index++;
    });
}