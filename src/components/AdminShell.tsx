'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredAuth, logoutApi, useAuth } from '@/lib/auth';

const emptySubscribe = () => () => {};
function useMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const mounted = useMounted();
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.replace('/login');
        }
    }, [mounted, isAuthenticated, router]);

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch {
            clearStoredAuth();
        }
        router.replace('/login');
    };

    if (!mounted || !isAuthenticated) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="h-5 w-5 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Memeriksa akses panel admin...</span>
                </div>
            </div>
        );
    }

    const navItems = [
        {
            name: 'Master Dokter',
            href: '/admin/dokter',
            active: pathname === '/admin/dokter' || pathname.startsWith('/admin/dokter/'),
            icon: (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
        },
        {
            name: 'Rekap Absen',
            href: '/admin/absensi',
            active: pathname === '/admin/absensi' || pathname.startsWith('/admin/absensi/'),
            icon: (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex flex-1 min-h-[calc(100vh-4rem)] bg-gray-50">
            {/* Sidebar Desktop - Clean & Neutral */}
            <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col lg:justify-between">
                <div className="p-3">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                    item.active
                                        ? 'bg-gray-100 text-gray-900 border border-gray-300'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <span className={item.active ? 'text-gray-900' : 'text-gray-500'}>
                                    {item.icon}
                                </span>
                                <span className="flex-1 truncate">{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="p-3 space-y-2 border-t border-gray-200">
                    <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-200/70">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Pegawai: {user?.no_pegawai || '-'}
                        </p>
                        <p className="truncate text-xs font-bold text-gray-800">
                            {user?.name || 'Administrator'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 hover:text-rose-800"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation Bar & Main Content */}
            <div className="min-w-0 flex-1 flex flex-col">
                <div className="sticky top-16 z-20 border-b border-gray-200 bg-white px-4 py-2.5 lg:hidden">
                    <div className="flex items-center justify-between gap-2">
                        <nav className="flex items-center gap-1.5 overflow-x-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                                        item.active
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                                title="Keluar"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>

                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
