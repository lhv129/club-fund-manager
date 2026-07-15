"use client";

import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Avatar from "@/components/shared/ui/Avatar";
import SwitchDarkMode2 from "@/components/shared/ui/SwitchDarkMode2";
import { APP_ROUTES } from "@/constants";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconProfile() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12.16 10.87C12.06 10.86 11.94 10.86 11.83 10.87C9.45 10.79 7.56 8.84 7.56 6.44C7.56 3.99 9.54 2 12 2C14.45 2 16.44 3.99 16.44 6.44C16.43 8.84 14.54 10.79 12.16 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.16 14.56C4.74 16.18 4.74 18.82 7.16 20.43C9.91 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.92 12.73 7.16 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconMoon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12.0001 7.89L10.9301 9.75C10.6901 10.16 10.8901 10.5 11.3601 10.5H12.6301C13.1101 10.5 13.3001 10.84 13.0601 11.25L12.0001 13.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.3 18.04V16.88C6 15.49 4.11 12.78 4.11 9.9C4.11 4.95 8.66 1.07 13.8 2.19C16.06 2.69 18.04 4.19 19.07 6.26C21.16 10.46 18.96 14.92 15.73 16.87V18.03C15.73 18.32 15.84 18.99 14.77 18.99H9.26C8.16 19 8.3 18.57 8.3 18.04Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 22C10.79 21.35 13.21 21.35 15.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconLogout() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.85 8.65L2.5 12L5.85 15.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AvatarDropdownUser {
    fullname?: string;
    username?: string;
    email?: string;
    /** Path lưu trong DB (CloudImage tự ghép domain) hoặc null → hiển thị initials */
    avatar?: string | null;
}

interface AvatarDropdownProps {
    user: AvatarDropdownUser;
    onLogout: () => void;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AvatarDropdown({ user, onLogout, className = "" }: AvatarDropdownProps) {
    const t = useTranslations("header");

    return (
        <Popover className={`relative flex ${className}`}>
            {({ close }) => (
                <>
                    {/* ── Trigger ── */}
                    <Popover.Button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-gray-800 transition-colors focus:outline-none">
                        <Avatar
                            imgUrl={user.avatar}
                            userName={user.fullname}
                            sizeClass="w-8 h-8 sm:w-9 sm:h-9 text-sm"
                        />
                        <span className="hidden sm:block text-sm font-semibold text-zinc-700 dark:text-gray-200 max-w-[120px] truncate">
                            {user.fullname ?? user.username ?? "User"}
                        </span>
                    </Popover.Button>

                    {/* ── Panel ── */}
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)]">
                            <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                                <div className="bg-white dark:bg-gray-900">

                                    {/* ── User info ── */}
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-gray-800">
                                        <Avatar
                                            imgUrl={user.avatar}
                                            userName={user.fullname}
                                            sizeClass="w-11 h-11 text-base"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                {user.fullname ?? user.username ?? "—"}
                                            </p>
                                            {user.username && user.fullname && (
                                                <p className="text-xs text-zinc-400 dark:text-gray-500 truncate">
                                                    @{user.username}
                                                </p>
                                            )}
                                            <p className="text-xs text-zinc-500 dark:text-gray-400 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Menu items ── */}
                                    <div className="px-3 py-2 flex flex-col gap-0.5">

                                        {/* Profile */}
                                        <Link
                                            href={APP_ROUTES.profile as never}
                                            onClick={() => close()}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="text-zinc-400 dark:text-gray-500">
                                                <IconProfile />
                                            </span>
                                            {t("myAccount")}
                                        </Link>

                                        {/* Dark mode */}
                                        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-gray-800 transition-colors cursor-default">
                                            <div className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-gray-300">
                                                <span className="text-zinc-400 dark:text-gray-500">
                                                    <IconMoon />
                                                </span>
                                                {t("darkMode")}
                                            </div>
                                            <SwitchDarkMode2 />
                                        </div>

                                    </div>

                                    {/* ── Logout ── */}
                                    <div className="px-3 pb-3">
                                        <div className="border-t border-zinc-100 dark:border-gray-800 mb-2" />
                                        <button
                                            onClick={() => { close(); onLogout(); }}
                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        >
                                            <IconLogout />
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