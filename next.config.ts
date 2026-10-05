import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
const api = new URL(apiUrl);

const nextConfig: NextConfig = {
    allowedDevOrigins: [...new Set([api.hostname, 'localhost', '127.0.0.1'])],
};

export default nextConfig;
