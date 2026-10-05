import { useSyncExternalStore } from 'react';
import { apiJson } from './api';
import type { AuthUser, LoginResponse } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

let cachedRawUser: string | null = null;
let cachedUser: AuthUser | null = null;

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
        cachedRawUser = null;
        cachedUser = null;
        return null;
    }
    if (raw === cachedRawUser) {
        return cachedUser;
    }
    try {
        cachedRawUser = raw;
        cachedUser = JSON.parse(raw) as AuthUser;
        return cachedUser;
    } catch {
        cachedRawUser = null;
        cachedUser = null;
        return null;
    }
}

export function setStoredAuth(token: string, user: AuthUser): void {
    if (typeof window === 'undefined') return;
    cachedRawUser = JSON.stringify(user);
    cachedUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, cachedRawUser);
    window.dispatchEvent(new Event('auth-change'));
}

export function clearStoredAuth(): void {
    if (typeof window === 'undefined') return;
    cachedRawUser = null;
    cachedUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('auth-change'));
}

function subscribeAuth(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('auth-change', callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener('auth-change', callback);
        window.removeEventListener('storage', callback);
    };
}

export function useAuth() {
    const token = useSyncExternalStore(
        subscribeAuth,
        getStoredToken,
        () => null,
    );
    const user = useSyncExternalStore(
        subscribeAuth,
        getStoredUser,
        () => null,
    );

    return {
        isAuthenticated: Boolean(token),
        token,
        user,
    };
}

export async function loginApi(no_pegawai: string, password: string): Promise<LoginResponse> {
    const data = await apiJson<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify({ no_pegawai, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
}

export async function logoutApi(): Promise<void> {
    try {
        await apiJson('/logout', { method: 'POST' });
    } catch {
        // Abaikan error saat logout
    } finally {
        clearStoredAuth();
    }
}
