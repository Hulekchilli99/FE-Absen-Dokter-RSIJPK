'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ApiError, apiDownload, apiJson } from '@/lib/api';
import type { Attendance, Doctor, Paginated } from '@/lib/types';

type ReportResponse = {
    data: Paginated<Attendance>;
    filters: {
        date_from: string;
        date_to: string;
        doctor_id: number | null;
    };
};

type DoctorsResponse = { data: Doctor[] };

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[3]}/${match[2]}/${match[1]}`;
        return '-';
    }
    return date.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatTimeDisplay(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const formatted = date.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return `${formatted.replace(/\./g, ':')} WIB`;
}

function getStatusLokasi(distance: number, accuracy: number | null): { label: string; keterangan: string } {
    if (accuracy !== null && accuracy > 50) {
        return { label: 'Perlu Dicek', keterangan: `Akurasi GPS rendah (±${Math.round(accuracy)}m)` };
    }
    if (distance <= 50) {
        return { label: 'Sesuai', keterangan: 'Area inti RS' };
    }
    if (distance <= 150) {
        return { label: 'Valid', keterangan: 'Dalam area RS' };
    }
    return { label: 'Batas Luar', keterangan: `Mepet radius RS (${distance}m)` };
}

export default function AttendanceReportPage() {
    const today = formatDateInput(new Date());
    const [dateFrom, setDateFrom] = useState(formatDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [dateTo, setDateTo] = useState(today);
    const [doctorId, setDoctorId] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [report, setReport] = useState<Paginated<Attendance> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const fetchReport = (from: string, to: string, doctor: string, page = 1) => {
        const params = new URLSearchParams({
            date_from: from,
            date_to: to,
            page: String(page),
        });
        if (doctor) params.set('doctor_id', doctor);

        return apiJson<ReportResponse>(`/attendances?${params.toString()}`);
    };

    const loadReport = (event?: FormEvent, pageToLoad = 1) => {
        event?.preventDefault();
        setLoading(true);
        setError('');

        fetchReport(dateFrom, dateTo, doctorId, pageToLoad)
            .then((response) => {
                setReport(response.data);
                setCurrentPage(response.data.current_page);
            })
            .catch(() => setError('Rekap absensi belum dapat dimuat dari backend.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        apiJson<DoctorsResponse>('/doctors?include_inactive=1')
            .then((response) => setDoctors(response.data))
            .catch(() => undefined);

        fetchReport(dateFrom, dateTo, doctorId, 1)
            .then((response) => {
                setReport(response.data);
                setCurrentPage(response.data.current_page);
            })
            .catch(() => setError('Rekap absensi belum dapat dimuat dari backend.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPreset = (type: 'today' | 'last7' | 'thisMonth') => {
        const now = new Date();
        const todayStr = formatDateInput(now);

        if (type === 'today') {
            setDateFrom(todayStr);
            setDateTo(todayStr);
            loadWithDates(todayStr, todayStr);
        } else if (type === 'last7') {
            const last7 = new Date();
            last7.setDate(now.getDate() - 6);
            const fromStr = formatDateInput(last7);
            setDateFrom(fromStr);
            setDateTo(todayStr);
            loadWithDates(fromStr, todayStr);
        } else if (type === 'thisMonth') {
            const firstDay = formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
            setDateFrom(firstDay);
            setDateTo(todayStr);
            loadWithDates(firstDay, todayStr);
        }
    };

    const loadWithDates = (from: string, to: string) => {
        setLoading(true);
        setError('');
        fetchReport(from, to, doctorId, 1)
            .then((response) => {
                setReport(response.data);
                setCurrentPage(response.data.current_page);
            })
            .catch(() => setError('Rekap absensi belum dapat dimuat dari backend.'))
            .finally(() => setLoading(false));
    };

    const handlePageChange = (newPage: number) => {
        if (!report || newPage < 1 || newPage > report.last_page) return;
        loadReport(undefined, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownload = async () => {
        const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        if (doctorId) params.set('doctor_id', doctorId);

        const dateLabel = dateFrom === dateTo ? dateFrom : `${dateFrom}-${dateTo}`;
        const fallbackName = `rekap-absensi-dokter-${dateLabel}.xlsx`;

        setExporting(true);
        setError('');

        try {
            await apiDownload(`/attendances/export?${params.toString()}`, fallbackName);
        } catch (err) {
            setError(
                err instanceof ApiError && err.status === 401
                    ? 'Sesi Anda sudah berakhir. Silakan login ulang untuk mengunduh rekap.'
                    : 'Rekap Excel gagal diunduh. Coba lagi.',
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Rekap Absen
                    </h1>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Riwayat presensi dokter dan hasil verifikasi lokasi GPS.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={exporting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>{exporting ? 'Menyiapkan...' : 'Download Excel'}</span>
                </button>
            </div>

            {/* Filter */}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Filter Data</span>
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400">Pilihan:</span>
                        <button
                            type="button"
                            onClick={() => setPreset('today')}
                            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreset('last7')}
                            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreset('thisMonth')}
                            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Bulan Ini
                        </button>
                    </div>
                </div>

                <form onSubmit={loadReport} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
                    <div>
                        <label htmlFor="date_from" className="mb-1 block text-xs font-medium text-gray-700">
                            Dari Tanggal
                        </label>
                        <input
                            id="date_from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label htmlFor="date_to" className="mb-1 block text-xs font-medium text-gray-700">
                            Sampai Tanggal
                        </label>
                        <input
                            id="date_to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label htmlFor="doctor_id" className="mb-1 block text-xs font-medium text-gray-700">
                            Dokter
                        </label>
                        <select
                            id="doctor_id"
                            value={doctorId}
                            onChange={(e) => setDoctorId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900"
                        >
                            <option value="">Semua Dokter ({doctors.length})</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.name} {!doctor.is_active ? '(Nonaktif)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-black"
                    >
                        Terapkan
                    </button>
                </form>
            </section>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Results Table */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 p-3 text-xs">
                    <div>
                        <span className="font-bold text-gray-900">Data Rekap</span>
                        <span className="ml-1.5 text-gray-500">
                            ({report?.total ?? 0} total data)
                        </span>
                    </div>
                    {report && report.last_page > 1 && (
                        <span className="text-gray-500">
                            Halaman {report.current_page} dari {report.last_page}
                        </span>
                    )}
                </div>

                {loading ? (
                    <p className="py-14 text-center text-xs text-gray-500">Memuat data rekap...</p>
                ) : !report?.data.length ? (
                    <p className="py-14 text-center text-xs text-gray-500">
                        Tidak ada data absensi untuk filter yang dipilih.
                    </p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">
                                        <th className="px-4 py-2.5">Tanggal</th>
                                        <th className="px-4 py-2.5">Waktu</th>
                                        <th className="px-4 py-2.5">Dokter</th>
                                        <th className="px-4 py-2.5">Tempat</th>
                                        <th className="px-4 py-2.5">Jarak</th>
                                        <th className="px-4 py-2.5">Status Lokasi</th>
                                        <th className="px-4 py-2.5 text-right">Peta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.data.map((attendance) => {
                                        const dist = Math.round(Number(attendance.distance_meters));
                                        const accuracy = attendance.accuracy_meters !== null ? Number(attendance.accuracy_meters) : null;
                                        const status = getStatusLokasi(dist, accuracy);
                                        const mapUrl = `https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`;

                                        return (
                                            <tr key={attendance.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2.5 font-medium text-gray-900">
                                                    {formatDateDisplay(attendance.checked_in_at || attendance.attendance_date)}
                                                </td>

                                                <td className="px-4 py-2.5 text-gray-600">
                                                    {formatTimeDisplay(attendance.checked_in_at)}
                                                </td>

                                                <td className="px-4 py-2.5 font-medium text-gray-900">
                                                    {attendance.doctor.name}
                                                </td>

                                                <td className="px-4 py-2.5 text-gray-600">
                                                    RSIJ Pondok Kopi
                                                </td>

                                                <td className="px-4 py-2.5 text-gray-700">
                                                    {dist} meter
                                                </td>

                                                <td className="px-4 py-2.5">
                                                    <span className="inline-block rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-800">
                                                        {status.label}
                                                    </span>
                                                    <span className="block text-[10px] text-gray-500">
                                                        {status.keterangan}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-2.5 text-right">
                                                    <a
                                                        href={mapUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 hover:text-black"
                                                    >
                                                        <span>Cek Peta</span>
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {report.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-xs">
                                <span className="text-gray-500">
                                    Halaman {report.current_page} dari {report.last_page}
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1 || loading}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage >= report.last_page || loading}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
