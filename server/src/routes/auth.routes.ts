import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false, // set true when served over HTTPS in production
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ---- Register ----
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["INVENTORY_MANAGER", "WAREHOUSE_STAFF"]).optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role || "WAREHOUSE_STAFF",
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie("token", token, COOKIE_OPTS);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    next(err);
  }
});

// ---- Login ----
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError("Invalid email or password.", 401);

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password.", 401);

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie("token", token, COOKIE_OPTS);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: "Enter a valid email and password." });
    next(err);
  }
});

// ---- Logout ----
router.post("/logout", (_req, res) => {
  res.clearCookie("token", COOKIE_OPTS);
  res.json({ message: "Logged out." });
});

// ---- Current user ----
router.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError("User not found.", 404);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

// ---- Password reset (demo OTP flow — no real email/SMS, safe for local hackathon demo) ----
// In-memory store is fine here: single-process dev server, short-lived codes only.
const resetCodes = new Map<string, { code: string; expires: number }>();

router.post("/reset-password/request", async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond the same way whether or not the user exists (avoid leaking which emails are registered)
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      resetCodes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });
      console.log(`[DEMO OTP] Password reset code for ${email}: ${code}`);
    }
    res.json({
      message: "If that email is registered, a reset code has been generated. Check the server console (demo mode).",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password/confirm", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().length(6),
      newPassword: z.string().min(6),
    });
    const { email, code, newPassword } = schema.parse(req.body);

    const entry = resetCodes.get(email);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      throw new AppError("Invalid or expired reset code.", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    resetCodes.delete(email);

    res.json({ message: "Password updated. You can now log in." });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: "Invalid reset details." });
    next(err);
  }
});

export default router;
