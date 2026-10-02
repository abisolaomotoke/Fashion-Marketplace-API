import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError, asyncHandler, parse } from "../errors";
import { idSchema, pageMeta, paginationShape } from "../pagination";

export const ordersRouter = Router();

const statusEnum = z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]);

// Allowed status changes. Anything not listed here is refused.
const ALLOWED: Record<string, string[]> = {
    pending: ["paid", "cancelled"],
    paid: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
};

const itemSelect = {
    id: true,
    productColourId: true,
    productName: true,
    colourName: true,
    unitPrice: true,
    quantity: true,
};

const listQuery = z
    .object({
        ...paginationShape,
        status: statusEnum.optional(),
        customerId: z.string().uuid("customerId must be a valid UUID").optional(),
        minTotal: z.coerce.number().int("minTotal must be a whole number").min(0, "minTotal must be 0 or greater").optional(),
        maxTotal: z.coerce.number().int("maxTotal must be a whole number").min(0, "maxTotal must be 0 or greater").optional(),
        sort: z.enum(["createdAt", "total"]).default("createdAt"),
        order: z.enum(["asc", "desc"]).default("desc"),
    })
    .refine((q) => q.minTotal === undefined || q.maxTotal === undefined || q.minTotal <= q.maxTotal, {
        message: "minTotal cannot be greater than maxTotal",
        path: ["minTotal"],
    });

// Limits keep every order total safely inside the database's number range
const createBody = z
    .object({
        customerId: z.string().uuid("customerId must be a valid UUID"),
        deliveryAddress: z.string().trim().min(1, "deliveryAddress must not be empty"),
        items: z
            .array(
                z.object({
                    productColourId: z.string().uuid("productColourId must be a valid UUID"),
                    quantity: z.number().int("quantity must be a whole number").min(1, "quantity must be 1 or more").max(10, "quantity must be 10 or less"),
                }),
            )
            .min(1, "items must contain at least one item")
            .max(10, "items must contain 10 items or fewer"),
    })
    .refine((b) => new Set(b.items.map((i) => i.productColourId)).size === b.items.length, {
        message: "each productColourId can only appear once",
        path: ["items"],
    });

const patchBody = z
    .object({
        status: statusEnum.optional(),
        deliveryAddress: z.string().trim().min(1, "deliveryAddress must not be empty").optional(),
    })
    .refine((b) => b.status !== undefined || b.deliveryAddress !== undefined, {
        message: "provide at least one field to update: status or deliveryAddress",
    });

// GET /api/v1/orders
ordersRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const q = parse(listQuery, req.query);
        const where = {
            status: q.status,
            customerId: q.customerId,
            total: { gte: q.minTotal, lte: q.maxTotal },
        };

        const [total, rows] = await prisma.$transaction([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
                skip: q.offset,
                take: q.limit,
                select: {
                    id: true,
                    customerId: true,
                    status: true,
                    total: true,
                    currency: true,
                    createdAt: true,
                    _count: { select: { items: true } },
                },
            }),
        ]);

        res.json({ data: rows, meta: pageMeta(total, q.limit, q.offset, rows.length) });
    }),
);

// GET /api/v1/orders/:id
ordersRouter.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const id = parse(idSchema, req.params.id);
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: { select: itemSelect } },
        });
        if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");
        res.json({ data: order, meta: {} });
    }),
);

// POST /api/v1/orders
ordersRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const body = parse(createBody, req.body ?? {}, 422);

        const customer = await prisma.customer.findUnique({ where: { id: body.customerId }, select: { id: true } });
        if (!customer) throw new AppError(422, "VALIDATION_ERROR", "customerId: customer does not exist");

        const ids = body.items.map((i) => i.productColourId);
        const colours = await prisma.productColour.findMany({
            where: { id: { in: ids } },
            include: { product: { select: { name: true, price: true } } },
        });
        if (colours.length !== ids.length) {
            throw new AppError(422, "VALIDATION_ERROR", "items: one or more productColourId values do not exist");
        }

        // The server works out names, prices and the total. The client never sends them.
        const byId = new Map(colours.map((c) => [c.id, c]));
        let total = 0;
        const itemsData = body.items.map((i) => {
            const c = byId.get(i.productColourId)!;
            total += c.product.price * i.quantity;
            return {
                productColourId: c.id,
                productName: c.product.name,
                colourName: c.colour,
                unitPrice: c.product.price,
                quantity: i.quantity,
            };
        });

        const order = await prisma.order.create({
            data: {
                customerId: body.customerId,
                deliveryAddress: body.deliveryAddress,
                total,
                currency: "NGN",
                status: "pending",
                items: { create: itemsData },
            },
            include: { items: { select: itemSelect } },
        });

        res.status(201).location(`/api/v1/orders/${order.id}`).json({ data: order, meta: {} });
    }),
);

// PATCH /api/v1/orders/:id
ordersRouter.patch(
    "/:id",
    asyncHandler(async (req, res) => {
        const id = parse(idSchema, req.params.id);
        const body = parse(patchBody, req.body ?? {}, 422);

        const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
        if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");

        const data: { status?: typeof order.status; deliveryAddress?: string } = {};

        if (body.status !== undefined && body.status !== order.status) {
            if (!ALLOWED[order.status].includes(body.status)) {
                throw new AppError(409, "INVALID_TRANSITION", `cannot change status from ${order.status} to ${body.status}`);
            }
            data.status = body.status;
        }

        if (body.deliveryAddress !== undefined) {
            if (order.status !== "pending") {
                throw new AppError(409, "ORDER_LOCKED", "deliveryAddress can only be changed while the order is pending");
            }
            data.deliveryAddress = body.deliveryAddress;
        }

        const updated = await prisma.order.update({
            where: { id },
            data,
            include: { items: { select: itemSelect } },
        });

        res.json({ data: updated, meta: {} });
    }),
);

// DELETE /api/v1/orders/:id
ordersRouter.delete(
    "/:id",
    asyncHandler(async (req, res) => {
        const id = parse(idSchema, req.params.id);
        const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
        if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");
        await prisma.order.delete({ where: { id } }); // its items are deleted with it
        res.status(204).send();
    }),
);
