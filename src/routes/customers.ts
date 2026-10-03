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

const createBody = z.object({
    name: z.string({ error: "name is required" }).min(1, "name is required"),
    email: z.string({ error: "email is required" }).email("email must be a valid email"),
    phone: z.string({ error: "phone is required" }).min(1, "phone is required"),
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

// POST /api/v1/customers
customersRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const result = createBody.safeParse(req.body ?? {});
        if (!result.success) {
            const issue = result.error.issues[0];
            const field = issue.path.join(".");
            throw new AppError(422, "VALIDATION_ERROR", `${field}: ${issue.message}`);
        }

        try {
            const customer = await prisma.customer.create({ data: result.data });
            res.status(201).json({ data: customer, meta: {} });
        } catch (e) {
            if ((e as { code?: string }).code === "P2002") {
                throw new AppError(409, "CONFLICT", "A customer with this email already exists");
            }
            throw e;
        }
    }),
);
