'use client';

import { FormEvent, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginApi, useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

const emptySubscribe = () => () => {};
function useMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

export default function LoginPage() {
    const router = useRouter();
    const mounted = useMounted();
    const { isAuthenticated } = useAuth();
    const [noPegawai, setNoPegawai] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mounted && isAuthenticated) {
            router.replace('/admin/dokter');
        }
    }, [mounted, isAuthenticated, router]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginApi(noPegawai, password);
            router.replace('/admin/dokter');
        } catch (err) {
            if (err instanceof ApiError) {
                const firstError = Object.values(err.errors).flat()[0];
                setError(firstError ?? err.message ?? 'Login gagal. Periksa nomor pegawai dan password.');
            } else {
                setError('Terjadi kesalahan saat menghubungi server.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || isAuthenticated) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="h-5 w-5 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Memeriksa autentikasi...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
                    <div className="mb-6 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.jpg"
                            alt="Logo RSIJ Pondok Kopi"
                            className="mx-auto h-14 w-14 rounded-xl object-contain shadow-xs"
                        />
                        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Login Panel Admin
                        </h1>
                        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                            Silakan masukkan nomor pegawai dan password Anda
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800" role="alert">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                            </svg>
                            <span className="flex-1 text-xs sm:text-sm leading-relaxed">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="no_pegawai" className="block text-xs font-semibold text-slate-700">
                                Nomor Pegawai
                            </label>
                            <div className="relative mt-1.5">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </span>
                                <input
                                    id="no_pegawai"
                                    type="text"
                                    required
                                    autoFocus
                                    value={noPegawai}
                                    onChange={(e) => setNoPegawai(e.target.value)}
                                    placeholder="Contoh: 123456"
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                                Password
                            </label>
                            <div className="relative mt-1.5">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white shadow-md shadow-slate-950/10 transition hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Masuk ke Panel Admin</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Kembali ke Halaman Absensi</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
