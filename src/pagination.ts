import { z } from "zod";
import { config } from "./config";

// limit above the maximum is clamped, not refused. A negative offset is refused.
export const paginationShape = {
    limit: z.coerce
        .number()
        .int("limit must be a whole number")
        .min(1, "limit must be 1 or more")
        .default(config.pagination.defaultLimit)
        .transform((n) => Math.min(n, config.pagination.maxLimit)),
    offset: z.coerce
        .number()
        .int("offset must be a whole number")
        .min(0, "offset must be 0 or greater")
        .default(0),
};

export const idSchema = z.string().uuid("id must be a valid UUID");

export function pageMeta(total: number, limit: number, offset: number, count: number) {
    return { total, limit, offset, hasMore: offset + count < total };
}
