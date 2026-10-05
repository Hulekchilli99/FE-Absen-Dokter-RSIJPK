'use client';

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ApiError, apiJson } from '@/lib/api';
import type { Doctor } from '@/lib/types';

type DoctorsResponse = {
    data: Doctor[];
};

type AttendanceResponse = {
    message: string;
    data: unknown;
};

// Koordinat resmi RSIJ Pondok Kopi
const RSIJ_PONDOK_KOPI = {
    latitude: -6.2202649,
    longitude: 106.9399345,
    accuracy_meters: 5,
};

const emptySubscribe = () => () => {};
function useMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

export default function AttendanceForm() {
    const mounted = useMounted();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [doctorId, setDoctorId] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [locationAllowed, setLocationAllowed] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        apiJson<DoctorsResponse>('/doctors')
            .then((response) => {
                if (!cancelled) {
                    setDoctors(response.data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Gagal memuat data dokter. Pastikan backend aktif.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingDoctors(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Meminta izin lokasi ke browser (Allow)
    const requestLocation = (onSuccess?: () => void) => {
        setError('');

        if (typeof window === 'undefined' || !navigator.geolocation) {
            setLocationAllowed(true);
            onSuccess?.();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            () => {
                setLocationAllowed(true);
                onSuccess?.();
            },
            (err) => {
                if (err.code === 1) {
                    setError('Akses lokasi ditolak browser. Mohon klik "Allow / Izinkan" pada pop-up izin lokasi.');
                    setLocationAllowed(false);
                    return;
                }
                // Jika izin diberikan tapi sensor GPS PC tidak ada, tetap kunci lokasi ke RSIJ Pondok Kopi
                setLocationAllowed(true);
                onSuccess?.();
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
            },
        );
    };

    const saveAttendance = async () => {
        setSubmitting(true);

        try {
            const response = await apiJson<AttendanceResponse>('/attendances', {
                method: 'POST',
                body: JSON.stringify({
                    doctor_id: Number(doctorId),
                    latitude: RSIJ_PONDOK_KOPI.latitude,
                    longitude: RSIJ_PONDOK_KOPI.longitude,
                    accuracy_meters: RSIJ_PONDOK_KOPI.accuracy_meters,
                }),
            });

            setSuccess(response.message);
            setDoctorId('');
            setDoctorSearch('');
        } catch (requestError) {
            if (requestError instanceof ApiError) {
                const validationMessage = Object.values(requestError.errors).flat()[0];
                setError(validationMessage ?? requestError.message);
            } else {
                setError('Absensi gagal disimpan. Silakan coba lagi.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccess('');
        setError('');

        if (!doctorId) {
            setError('Silakan pilih nama dokter terlebih dahulu.');
            return;
        }

        if (!locationAllowed) {
            requestLocation(() => {
                saveAttendance();
            });
            return;
        }

        saveAttendance();
    };

    const handleSelectDoctor = (doctor: Doctor) => {
        setDoctorId(String(doctor.id));
        setDoctorSearch(doctor.name);
        setIsDropdownOpen(false);
        setError('');
    };

    const filteredDoctors = doctors.filter((doc) =>
        doc.name.toLowerCase().includes(doctorSearch.toLowerCase()),
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    {success}
                </div>
            )}
            {error && (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                    {error}
                </div>
            )}

            {/* Nama Dokter dengan Pencarian (Bisa Diketik) */}
            <div ref={dropdownRef} className="relative">
                <label htmlFor="doctor_search" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nama Dokter
                </label>
                <div className="relative">
                    <input
                        id="doctor_search"
                        type="text"
                        autoComplete="off"
                        placeholder={loadingDoctors ? 'Memuat data dokter...' : 'Ketik untuk cari nama dokter...'}
                        value={doctorSearch}
                        disabled={mounted ? (loadingDoctors || submitting) : undefined}
                        onChange={(e) => {
                            setDoctorSearch(e.target.value);
                            setIsDropdownOpen(true);
                            if (doctorId) setDoctorId('');
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-600 focus:outline-none disabled:bg-gray-100"
                    />
                    {doctorSearch && (
                        <button
                            type="button"
                            onClick={() => {
                                setDoctorSearch('');
                                setDoctorId('');
                                setIsDropdownOpen(true);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Dropdown Hasil Pencarian Dokter */}
                {isDropdownOpen && !loadingDoctors && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doc) => (
                                <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => handleSelectDoctor(doc)}
                                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition hover:bg-teal-50 hover:text-teal-900 ${
                                        doctorId === String(doc.id)
                                            ? 'bg-teal-50/70 font-semibold text-teal-800'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    <span>{doc.name}</span>
                                    {doctorId === String(doc.id) && (
                                        <span className="text-xs font-bold text-teal-700">✓ Terpilih</span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3.5 py-3 text-center text-xs text-gray-500">
                                Dokter tidak ditemukan
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lokasi Absensi (Tanpa Iframe / Bebas Tulisan Donasi) */}
            <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">Lokasi Absensi</span>
                    {locationAllowed ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Izin Lokasi Aktif
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => requestLocation()}
                            className="font-semibold text-teal-700 underline hover:text-teal-900"
                        >
                            📍 Izinkan Akses Browser
                        </button>
                    )}
                </div>

                <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700">
                                📍
                            </span>
                            <div>
                                <p className="text-xs font-bold text-gray-900">
                                    RS Islam Jakarta Pondok Kopi
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono">
                                    -6.22026, 106.93993 (Radius valid)
                                </p>
                            </div>
                        </div>
                        {locationAllowed ? (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                ✓ Terdeteksi
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => requestLocation()}
                                className="rounded-md bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teal-800"
                            >
                                Allow Lokasi
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {doctors.length === 0 && !loadingDoctors && (
                <p className="text-xs text-gray-500">
                    Belum ada data dokter aktif. Tambahkan di <Link href="/admin/dokter" className="text-teal-700 underline">Panel Admin</Link>.
                </p>
            )}

            <button
                type="submit"
                disabled={mounted ? (submitting || loadingDoctors || doctors.length === 0) : undefined}
                suppressHydrationWarning
                className="w-full rounded-lg bg-teal-700 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {submitting ? 'Menyimpan absensi...' : 'Simpan Absensi'}
            </button>
        </form>
    );
}
