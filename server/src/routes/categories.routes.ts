import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories.map((c) => ({ id: c.id, name: c.name, productCount: c._count.products })));
  } catch (err) {
    next(err);
  }
});

const nameSchema = z.object({ name: z.string().min(1, "Category name is required") });

router.post("/", async (req, res, next) => {
  try {
    const { name } = nameSchema.parse(req.body);
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name } = nameSchema.parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data: { name } });
    res.json(category);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (productCount > 0) {
      throw new AppError(
        `Can't delete this category — ${productCount} product(s) still use it. Reassign or delete them first.`,
        409
      );
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: "Category deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
