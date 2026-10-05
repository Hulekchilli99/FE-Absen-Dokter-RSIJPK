export type Doctor = {
    id: number;
    name: string;
    is_active: boolean;
    attendances_count?: number;
};

export type Attendance = {
    id: number;
    attendance_date: string;
    checked_in_at: string;
    latitude: string | number;
    longitude: string | number;
    accuracy_meters: string | number | null;
    distance_meters: string | number;
    doctor: Doctor;
};

export type DashboardData = {
    active_doctor_count: number;
    today_attendance_count: number;
    all_attendance_count: number;
    recent_attendances: Attendance[];
};

export type Paginated<T> = {
    current_page: number;
    data: T[];
    last_page: number;
    total: number;
};

export type AuthUser = {
    id: number;
    name: string;
    no_pegawai: string;
    email?: string;
};

export type LoginResponse = {
    message: string;
    token: string;
    user: AuthUser;
};

