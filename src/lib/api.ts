const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (!headers.has('Authorization') && typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
    });

    if (response.status === 401 && typeof window !== 'undefined' && path !== '/login') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new Event('auth-change'));
    }

    return response;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, init);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? 'Permintaan ke server gagal.',
            response.status,
            payload?.errors ?? {},
        );
    }

    return payload as T;
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly errors: Record<string, string[]>;

    public constructor(message: string, status: number, errors: Record<string, string[]>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

export function apiUrl(path: string): string {
    return `${API_URL}${path}`;
}
