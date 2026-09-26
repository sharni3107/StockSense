import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";
import { requireAuth } from "../middleware/auth";
import { computeStockStatus } from "../utils/stockStatus";

const router = Router();
router.use(requireAuth);

// ---- List with search + filters ----
router.get("/", async (req, res, next) => {
  try {
    const { search, categoryId, status } = req.query as Record<string, string | undefined>;

    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryId || undefined,
        OR: search
          ? [{ name: { contains: search } }, { sku: { contains: search } }]
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        stocks: { include: { location: { select: { id: true, name: true, warehouseId: true } } } },
      },
      orderBy: { name: "asc" },
    });

    let shaped = products.map((p) => {
      const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        reorderLevel: p.reorderLevel,
        category: p.category,
        totalStock,
        locationCount: p.stocks.length,
        primaryLocation: p.stocks[0]?.location?.name ?? null,
        status: computeStockStatus(totalStock, p.reorderLevel),
      };
    });

    if (status) {
      shaped = shaped.filter((p) => p.status === status);
    }

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// ---- Single product with full stock breakdown (for the detail page) ----
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        stocks: { include: { location: { include: { warehouse: true } } } },
      },
    });
    if (!product) throw new AppError("Product not found.", 404);

    const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

    res.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      reorderLevel: product.reorderLevel,
      category: product.category,
      totalStock,
      status: computeStockStatus(totalStock, product.reorderLevel),
      stockByLocation: product.stocks.map((s) => ({
        locationId: s.location.id,
        locationName: s.location.name,
        warehouseName: s.location.warehouse.name,
        quantity: s.quantity,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- Create ----
const createSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit of measure is required"),
  reorderLevel: z.coerce.number().min(0).default(0),
  initialStock: z.coerce.number().min(0).default(0),
  locationId: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    if (data.initialStock > 0 && !data.locationId) {
      throw new AppError("Select a location to place the initial stock in.", 400);
    }

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError("Selected category does not exist.", 400);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          categoryId: data.categoryId,
          unit: data.unit,
          reorderLevel: data.reorderLevel,
        },
      });

      if (data.initialStock > 0 && data.locationId) {
        await tx.stock.create({
          data: { productId: created.id, locationId: data.locationId, quantity: data.initialStock },
        });
      }

      return created;
    });

    res.status(201).json(product);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

// ---- Update ----
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

// ---- Delete ----
router.delete("/:id", async (req, res, next) => {
  try {
    const hasStock = await prisma.stock.findFirst({
      where: { productId: req.params.id, quantity: { gt: 0 } },
    });
    if (hasStock) {
      throw new AppError("Can't delete a product that still has stock on hand.", 409);
    }
    const hasOperations = await prisma.operationItem.findFirst({ where: { productId: req.params.id } });
    if (hasOperations) {
      throw new AppError("Can't delete a product that appears in stock operations history.", 409);
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: "Product deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
