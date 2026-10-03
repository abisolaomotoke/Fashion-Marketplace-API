import { rateLimitConfig } from "../config";

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string) {
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
        hits.set(ip, { count: 1, resetAt: now + rateLimitConfig.windowMs });
        return { limited: false, retryAfter: 0 };
    }

    entry.count += 1;
    if (entry.count > rateLimitConfig.maxRequests) {
        return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { limited: false, retryAfter: 0 };
}
