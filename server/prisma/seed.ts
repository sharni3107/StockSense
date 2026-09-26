import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- Demo user ----
  const passwordHash = await bcrypt.hash("password123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "manager@stocksense.demo" },
    update: {},
    create: {
      name: "Alex Rivera",
      email: "manager@stocksense.demo",
      passwordHash,
      role: "INVENTORY_MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@stocksense.demo" },
    update: {},
    create: {
      name: "Sam Warehouse",
      email: "staff@stocksense.demo",
      passwordHash,
      role: "WAREHOUSE_STAFF",
    },
  });

  // ---- Categories ----
  const categoryNames = ["Metals", "Furniture", "Electronics", "Raw Materials"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories[name] = c.id;
  }

  // ---- Warehouses & Locations ----
  const main = await prisma.warehouse.upsert({
    where: { code: "WH-001" },
    update: {},
    create: { name: "Main Warehouse", code: "WH-001", address: "12 Industrial Ave" },
  });
  const secondary = await prisma.warehouse.upsert({
    where: { code: "WH-002" },
    update: {},
    create: { name: "Secondary Warehouse", code: "WH-002", address: "48 Depot Road" },
  });

  async function ensureLocation(warehouseId: string, name: string, code: string) {
    const existing = await prisma.location.findFirst({ where: { warehouseId, code } });
    if (existing) return existing;
    return prisma.location.create({ data: { warehouseId, name, code } });
  }

  const rackA = await ensureLocation(main.id, "Rack A", "RACK-A");
  const rackB = await ensureLocation(main.id, "Rack B", "RACK-B");
  const prodFloor = await ensureLocation(main.id, "Production Floor", "PROD-FLOOR");
  await ensureLocation(secondary.id, "Storage Area", "STORAGE");

  // ---- Products ----
  const products = [
    { name: "Steel Rod", sku: "SR-001", category: "Metals", unit: "kg", reorderLevel: 20 },
    { name: "Office Chair", sku: "OC-001", category: "Furniture", unit: "pcs", reorderLevel: 10 },
    { name: "Laptop", sku: "LT-001", category: "Electronics", unit: "pcs", reorderLevel: 5 },
    { name: "Wood Panel", sku: "WP-001", category: "Raw Materials", unit: "pcs", reorderLevel: 15 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        reorderLevel: p.reorderLevel,
        categoryId: categories[p.category],
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo login -> email: manager@stocksense.demo | password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
