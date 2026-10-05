'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const emptySubscribe = () => () => {};
function useMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

export default function AdminHeaderButton() {
    const mounted = useMounted();
    const { isAuthenticated } = useAuth();

    if (!mounted) {
        return (
            <Link
                href="/login"
                className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
            >
                Panel Admin
            </Link>
        );
    }

    if (isAuthenticated) {
        return (
            <Link
                href="/admin/dokter"
                className="relative inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50/80 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 hover:text-teal-900"
            >
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span>Panel Admin</span>
            </Link>
        );
    }

    return (
        <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
        >
            <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Login Admin</span>
        </Link>
    );
}
