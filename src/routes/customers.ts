import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError, asyncHandler, parse } from "../errors";
import { idSchema, pageMeta, paginationShape } from "../pagination";

export const customersRouter = Router();

const listQuery = z.object({
    ...paginationShape,
    search: z.string().min(1, "search must not be empty").optional(),
    createdAfter: z.coerce.date().optional(),
    sort: z.enum(["name", "createdAt"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
});

// GET /api/v1/customers
customersRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const q = parse(listQuery, req.query);
        const where = {
            name: q.search ? { contains: q.search, mode: "insensitive" as const } : undefined,
            createdAt: q.createdAfter ? { gte: q.createdAfter } : undefined,
        };

        const [total, rows] = await prisma.$transaction([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
                skip: q.offset,
                take: q.limit,
            }),
        ]);

        res.json({ data: rows, meta: pageMeta(total, q.limit, q.offset, rows.length) });
    }),
);

// GET /api/v1/customers/:id
customersRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const id = parse(idSchema, req.params.id);
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } },
        });
        if (!customer) throw new AppError(404, "NOT_FOUND", "Customer not found");
        res.json({ data: customer, meta: {} });
    }),
);
