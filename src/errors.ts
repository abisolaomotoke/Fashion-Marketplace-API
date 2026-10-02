import { NextFunction, Request, Response } from "express";
import { z } from "zod";

// An error we throw on purpose, with an honest status code
export class AppError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
    ) {
        super(message);
    }
}

// Lets async route handlers pass their errors to the error handler
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
        (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

// Checks input against a schema. Bad input becomes a 400 that names the field
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, status = 400): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue.path.join(".");
        throw new AppError(status, "VALIDATION_ERROR", field ? `${field}: ${issue.message}` : issue.message);
    }
    return result.data;
}

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
    });
}

// Every error leaves the API in the same shape
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    if (err?.type === "entity.parse.failed") {
        return res.status(400).json({
            error: { code: "MALFORMED_JSON", message: "Request body is not valid JSON" },
        });
    }
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
}
