import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/categories.routes";
import warehouseRoutes from "./routes/warehouses.routes";
import locationRoutes from "./routes/locations.routes";
import productRoutes from "./routes/products.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/products", productRoutes);
// Hour 3+ routes (stock, operations, ledger, dashboard, reordering-rules) will be
// mounted here in the same pattern.

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Inventory API running on http://localhost:${PORT}`);
});
