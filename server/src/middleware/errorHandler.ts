import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma unique constraint violation (e.g. duplicate SKU/email/reference)
  if (typeof err === "object" && err !== null && (err as any).code === "P2002") {
    const targets: string[] = (err as any).meta?.target || ["value"];
    const label = targets.join(" + ");
    return res.status(409).json({ error: `That ${label} already exists. Please use a different value.` });
  }

  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Something went wrong. Please try again." });
}
