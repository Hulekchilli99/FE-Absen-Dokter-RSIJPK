import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import AdminHeaderButton from '@/components/AdminHeaderButton';

export const metadata: Metadata = {
    title: {
        default: 'Absensi Dokter RS Islam Jakarta Pondok Kopi',
        template: '%s · Absensi Dokter RS Islam Jakarta Pondok Kopi',
    },
    description: 'Sistem absensi dokter berbasis lokasi RS Islam Jakarta Pondok Kopi.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className="flex min-h-screen flex-col bg-slate-100">
                <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-slate-200 bg-white">
                    <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
                        <Link href="/" className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo.jpg"
                                alt="Logo RS Islam Jakarta Pondok Kopi"
                                className="h-10 w-10 rounded-lg object-contain shadow-xs"
                            />
                            <span>
                                <span className="block text-sm sm:text-base font-bold text-slate-900">RS Islam Jakarta Pondok Kopi</span>
                            </span>
                        </Link>
                        <AdminHeaderButton />
                    </div>
                </header>
                {children}
            </body>
        </html>
    );
}
