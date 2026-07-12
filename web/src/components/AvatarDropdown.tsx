"use client";

import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";

interface User {
    fullname?: string;
    email?: string;
}

interface AvatarDropdownProps {
    user: User;
    onLogout: () => void;
}

function getInitials(fullname?: string) {
    return (
        fullname
            ?.split(" ")
            .map((n) => n[0])
            .slice(-2)
            .join("")
            .toUpperCase() ?? "?"
    );
}

export function AvatarDropdown({ user, onLogout }: AvatarDropdownProps) {
    const t = useTranslations("common");

    return (
        <Popover className="relative flex">
            {({ close }) => (
                <>
                    <Popover.Button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-gray-800 transition-colors focus:outline-none">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                            {getInitials(user.fullname)}
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-gray-300">
                            {user.fullname ?? "User"}
                        </span>
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 top-full z-50 mt-2 w-56">
                            <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                                <div className="bg-white dark:bg-gray-900">
                                    {/* User info */}
                                    <div className="border-b border-zinc-100 dark:border-gray-800 px-4 py-3">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                            {user.fullname}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-gray-400 truncate mt-0.5">
                                            {user.email}
                                        </p>
                                    </div>

                                    {/* Logout */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                close();
                                                onLogout();
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                                                <path
                                                    d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M15 12H3.62"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M5.85 8.65L2.5 12L5.85 15.35"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            {t("logout")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
