import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError, asyncHandler, parse } from "../errors";
import { idSchema, pageMeta, paginationShape } from "../pagination";

export const sellersRouter = Router();

const listQuery = z.object({
    ...paginationShape,
    city: z.string().min(1, "city must not be empty").optional(),
    search: z.string().min(1, "search must not be empty").optional(),
    sort: z.enum(["storeName", "city", "createdAt"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
});

// GET /api/v1/sellers
sellersRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const q = parse(listQuery, req.query);
        const where = {
            city: q.city ? { equals: q.city, mode: "insensitive" as const } : undefined,
            storeName: q.search ? { contains: q.search, mode: "insensitive" as const } : undefined,
        };

        const [total, rows] = await prisma.$transaction([
            prisma.seller.count({ where }),
            prisma.seller.findMany({
                where,
                orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
                skip: q.offset,
                take: q.limit,
            }),
        ]);

        res.json({ data: rows, meta: pageMeta(total, q.limit, q.offset, rows.length) });
    }),
);

// GET /api/v1/sellers/:id
sellersRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const id = parse(idSchema, req.params.id);
        const seller = await prisma.seller.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } },
        });
        if (!seller) throw new AppError(404, "NOT_FOUND", "Seller not found");
        res.json({ data: seller, meta: {} });
    }),
);
