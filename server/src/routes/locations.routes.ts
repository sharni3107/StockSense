import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const warehouseId = req.query.warehouseId as string | undefined;
    const locations = await prisma.location.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      orderBy: { name: "asc" },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

const schema = z.object({
  name: z.string().min(1, "Location name is required"),
  code: z.string().min(1, "Location code is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
});

router.post("/", async (req, res, next) => {
  try {
    const data = schema.parse(req.body);

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse) throw new AppError("Selected warehouse does not exist.", 400);

    const location = await prisma.location.create({ data });
    res.status(201).json(location);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const location = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(location);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

export default router;
