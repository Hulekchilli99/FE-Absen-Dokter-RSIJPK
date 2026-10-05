import AttendanceForm from '@/components/AttendanceForm';

export default function HomePage() {
    return (
        <>
            <main className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <AttendanceForm />
                </div>
            </main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
                © SIRS RS Islam Jakarta Pondok Kopi
            </footer>
        </>
    );
}
