import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { locations: true } } },
    });
    res.json(warehouses.map((w) => ({ ...w, locationCount: w._count.locations, _count: undefined })));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: { locations: true },
    });
    if (!warehouse) return res.status(404).json({ error: "Warehouse not found." });
    res.json(warehouse);
  } catch (err) {
    next(err);
  }
});

const schema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  code: z.string().min(1, "Warehouse code is required"),
  address: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const warehouse = await prisma.warehouse.create({ data });
    res.status(201).json(warehouse);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const warehouse = await prisma.warehouse.update({ where: { id: req.params.id }, data });
    res.json(warehouse);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

export default router;
