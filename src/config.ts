export const config = {
    port: Number(process.env.PORT) || 3000,
    pagination: { defaultLimit: 20, maxLimit: 100 },
    rateLimit: { windowMs: 60_000, maxRequests: 100 },
};