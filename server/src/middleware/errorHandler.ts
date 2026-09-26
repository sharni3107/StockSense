import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma unique constraint violation (e.g. duplicate SKU/email/reference)
  if (typeof err === "object" && err !== null && (err as any).code === "P2002") {
    const target = (err as any).meta?.target?.[0] || "value";
    return res.status(409).json({ error: `That ${target} is already in use.` });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
