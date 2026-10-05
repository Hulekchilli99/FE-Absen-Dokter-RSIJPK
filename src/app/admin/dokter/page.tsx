'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError, apiJson } from '@/lib/api';
import type { Doctor } from '@/lib/types';

type DoctorsResponse = { data: Doctor[] };

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const loadDoctors = () => {
        setLoading(true);
        apiJson<DoctorsResponse>('/doctors?include_inactive=1')
            .then((response) => setDoctors(response.data))
            .catch(() => setError('Data dokter belum dapat dimuat.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        apiJson<DoctorsResponse>('/doctors?include_inactive=1')
            .then((response) => setDoctors(response.data))
            .catch(() => setError('Data dokter belum dapat dimuat.'))
            .finally(() => setLoading(false));
    }, []);

    const resetForm = () => {
        setName('');
        setIsActive(true);
        setEditingDoctor(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            await apiJson(editingDoctor ? `/doctors/${editingDoctor.id}` : '/doctors', {
                method: editingDoctor ? 'PUT' : 'POST',
                body: JSON.stringify({ name, is_active: isActive }),
            });
            setMessage(editingDoctor ? 'Data dokter berhasil diperbarui.' : 'Dokter baru berhasil ditambahkan.');
            resetForm();
            loadDoctors();
        } catch (requestError) {
            if (requestError instanceof ApiError) {
                setError(Object.values(requestError.errors).flat()[0] ?? requestError.message);
            } else {
                setError('Data dokter gagal disimpan.');
            }
        } finally {
            setSaving(false);
        }
    };

    const editDoctor = (doctor: Doctor) => {
        setEditingDoctor(doctor);
        setName(doctor.name);
        setIsActive(doctor.is_active);
        setMessage('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteDoctor = async (doctor: Doctor) => {
        if (!window.confirm(`Hapus ${doctor.name} dari daftar master dokter?`)) return;

        setMessage('');
        setError('');
        try {
            await apiJson(`/doctors/${doctor.id}`, { method: 'DELETE' });
            setMessage('Dokter berhasil dihapus.');
            loadDoctors();
        } catch (requestError) {
            setError(requestError instanceof ApiError ? requestError.message : 'Dokter gagal dihapus.');
        }
    };

    const filteredDoctors = useMemo(() => {
        return doctors.filter((doc) => {
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'active'
                    ? doc.is_active
                    : !doc.is_active;
            return matchesSearch && matchesStatus;
        });
    }, [doctors, searchQuery, statusFilter]);

    const activeCount = useMemo(() => doctors.filter((d) => d.is_active).length, [doctors]);
    const inactiveCount = useMemo(() => doctors.filter((d) => !d.is_active).length, [doctors]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Master Dokter
                    </h1>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Kelola data dokter dan ketersediaan nama pada form absensi.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="rounded border border-gray-200 bg-white px-2.5 py-1">
                        Total: <strong>{doctors.length}</strong>
                    </span>
                    <span className="rounded border border-gray-200 bg-white px-2.5 py-1">
                        Aktif: <strong>{activeCount}</strong>
                    </span>
                    <span className="rounded border border-gray-200 bg-white px-2.5 py-1">
                        Nonaktif: <strong>{inactiveCount}</strong>
                    </span>
                </div>
            </div>

            {/* Notification */}
            {(message || error) && (
                <div
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium ${
                        error
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-gray-100 text-gray-800'
                    }`}
                >
                    <span>{error || message}</span>
                    <button
                        type="button"
                        onClick={() => {
                            setMessage('');
                            setError('');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Content Grid */}
            <div className="grid gap-5 lg:grid-cols-12">
                {/* Form Section */}
                <div className="lg:col-span-4">
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-sm font-bold text-gray-900">
                                {editingDoctor ? 'Edit Dokter' : 'Tambah Dokter'}
                            </h2>
                            {editingDoctor && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                                >
                                    Batal Edit
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label htmlFor="doctor_name" className="mb-1 block text-xs font-semibold text-gray-700">
                                    Nama Dokter <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="doctor_name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Contoh: dr. Ahmad Fauzi"
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <span>Status Aktif (muncul di form absensi)</span>
                            </label>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving || !name.trim()}
                                    className="w-full rounded-lg bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : editingDoctor ? 'Perbarui Data' : 'Simpan Dokter'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-8">
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {/* Table Controls */}
                        <div className="flex flex-col gap-2.5 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                Daftar Dokter ({filteredDoctors.length})
                            </h2>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama..."
                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900"
                                />

                                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('all')}
                                        className={`rounded px-2 py-1 ${
                                            statusFilter === 'all'
                                                ? 'bg-white font-semibold text-gray-900 shadow-2xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('active')}
                                        className={`rounded px-2 py-1 ${
                                            statusFilter === 'active'
                                                ? 'bg-white font-semibold text-gray-900 shadow-2xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Aktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('inactive')}
                                        className={`rounded px-2 py-1 ${
                                            statusFilter === 'inactive'
                                                ? 'bg-white font-semibold text-gray-900 shadow-2xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Nonaktif
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        {loading ? (
                            <p className="py-12 text-center text-xs text-gray-500">Memuat data dokter...</p>
                        ) : filteredDoctors.length === 0 ? (
                            <p className="py-12 text-center text-xs text-gray-500">
                                {searchQuery ? 'Tidak ada dokter yang cocok dengan pencarian.' : 'Belum ada data dokter.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">
                                            <th className="px-4 py-2.5">Nama Dokter</th>
                                            <th className="px-4 py-2.5">Status</th>
                                            <th className="px-4 py-2.5">Total Absen</th>
                                            <th className="px-4 py-2.5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDoctors.map((doctor) => {
                                            const isSelected = editingDoctor?.id === doctor.id;
                                            return (
                                                <tr
                                                    key={doctor.id}
                                                    className={isSelected ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50/50'}
                                                >
                                                    <td className="px-4 py-2.5 font-medium text-gray-900">
                                                        {doctor.name}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {doctor.is_active ? (
                                                            <span className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-500">
                                                                Nonaktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                        {doctor.attendances_count ?? 0} kali
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => editDoctor(doctor)}
                                                                className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            {(doctor.attendances_count ?? 0) === 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteDoctor(doctor)}
                                                                    className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
