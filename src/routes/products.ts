import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError, asyncHandler, parse } from "../errors";
import { idSchema, pageMeta, paginationShape } from "../pagination";

export const productsRouter = Router();

const listQuery = z
  .object({
    ...paginationShape,
    category: z.enum(["bags", "shoes", "clothes", "accessories"]).optional(),
    targetAudience: z.enum(["men", "women", "unisex"]).optional(),
    sellerId: z.string().uuid("sellerId must be a valid UUID").optional(),
    minPrice: z.coerce.number().int("minPrice must be a whole number").min(0, "minPrice must be 0 or greater").optional(),
    maxPrice: z.coerce.number().int("maxPrice must be a whole number").min(0, "maxPrice must be 0 or greater").optional(),
    sort: z.enum(["price", "createdAt", "name"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: "minPrice cannot be greater than maxPrice",
    path: ["minPrice"],
  });

// GET /api/v1/products
productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = parse(listQuery, req.query);

    const where = {
      category: q.category,
      targetAudience: q.targetAudience,
      sellerId: q.sellerId,
      price: { gte: q.minPrice, lte: q.maxPrice },
    };

    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        // The second sort key keeps the order stable when many products share a value
        orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
        skip: q.offset,
        take: q.limit,
        select: {
          id: true,
          sellerId: true,
          name: true,
          imageUrl: true,
          category: true,
          targetAudience: true,
          price: true,
          currency: true,
          sizeOrDimensions: true,
          colours: { select: { id: true, colour: true, stockQuantity: true } },
        },
      }),
    ]);

    res.json({ data: rows, meta: pageMeta(total, q.limit, q.offset, rows.length) });
  }),
);

// GET /api/v1/products/:id
productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colours: { select: { id: true, colour: true, stockQuantity: true } } },
    });
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
    res.json({ data: product, meta: {} });
  }),
);

// GET /api/v1/products/:id/colours
productsRouter.get(
  "/:id/colours",
  asyncHandler(async (req, res) => {
    const id = parse(idSchema, req.params.id);
    const q = parse(z.object(paginationShape), req.query);

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

    const where = { productId: id };
    const [total, rows] = await prisma.$transaction([
      prisma.productColour.count({ where }),
      prisma.productColour.findMany({
        where,
        orderBy: [{ colour: "asc" }, { id: "asc" }],
        skip: q.offset,
        take: q.limit,
        select: { id: true, productId: true, colour: true, stockQuantity: true },
      }),
    ]);

    res.json({ data: rows, meta: pageMeta(total, q.limit, q.offset, rows.length) });
  }),
);

export default productsRouter;