# StockSense — Modular Inventory Management System

## What's built so far (Hour 1 + Hour 2 of the plan)

### Hour 2 additions
- Full CRUD APIs: Categories, Warehouses, Locations, Products
- Products list with **search** (name/SKU), **filters** (category, stock status), computed total stock, stock status badge (In Stock / Low Stock / Out of Stock), and location summary
- Add Product form (name, SKU, category, unit, reorder level, optional initial stock + location)
- Product detail page: key info, stock-by-location breakdown, placeholder for movements (arrives once Receipts/Deliveries/Transfers/Adjustments are built)
- Edit Product page
- Categories page: create / edit / delete (blocked with a clear message if products still use the category)
- Warehouses page: create / edit
- Locations page: create / edit, filterable by warehouse
- New shared components: Table, Badge, Modal, ConfirmDialog, SearchBar, FilterBar, EmptyState/LoadingState/ErrorMessage

### Hour 1 recap

- Full project scaffold: `server/` (Node + Express + TypeScript + Prisma + SQLite) and `client/` (React + Vite + TypeScript + Tailwind)
- Complete database schema for the **whole** app (User, Category, Product, Warehouse, Location, Stock, InventoryOperation, OperationItem, StockLedger, ReorderingRule) — even though only Auth uses it yet
- Auth: Register, Login, Logout, `GET /me`, and a demo password-reset flow (OTP printed to the server console — no real email needed)
- Seed script with 2 demo users, 4 categories, 2 warehouses, 4 locations, 4 products
- Frontend: Login page, Register page, protected layout (sidebar + topbar), Dashboard page (placeholder — real KPIs come in Hour 6), and placeholder pages for every other route in the plan so navigation works end-to-end

Nothing here is faked — the frontend really calls the Express API, which really reads/writes SQLite through Prisma.

## How to run it

You need **Node.js 18+** installed. Open two terminals.

### Terminal 1 — Backend

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

You should see: `Inventory API running on http://localhost:4000`

### Terminal 2 — Frontend

```bash
cd client
npm install
npm run dev
```

You should see a local URL, typically `http://localhost:5173`. Open it in your browser.

## How to test what's built

1. Go to `http://localhost:5173` → you're redirected to `/login`.
2. The login form is pre-filled with the demo account (`manager@stocksense.demo` / `password123`) — click **Sign in**.
3. Expected result: you land on `/dashboard`, see the sidebar with all modules, your name/role top-right, and a "Logout" button.
4. Click **Logout** → you're sent back to `/login`.
5. Try **Register** with a new email → it creates a real user in the database and logs you straight in.
6. Try logging in with a wrong password → you get a clean "Invalid email or password" message, not a crash.

### Hour 2 testing

1. Go to **Categories** → you should see Metals, Furniture, Electronics, Raw Materials (from the seed). Add a new one, edit it, then try deleting "Metals" — it should be blocked since Steel Rod uses it.
2. Go to **Warehouses** → you should see Main Warehouse (WH-001) and Secondary Warehouse (WH-002). Add a new warehouse.
3. Go to **Locations** → you should see Rack A, Rack B, Production Floor (Main Warehouse) and Storage Area (Secondary Warehouse). Filter by warehouse. Add a new location.
4. Go to **Products** → you should see Steel Rod, Office Chair, Laptop, Wood Panel, all with 0 stock and an "Out of Stock" badge (seed data has no stock yet — that's expected until Receipts exist in Hour 3).
5. Click **Add Product**, fill it in with Initial Stock = 0, save → it appears in the list immediately.
6. Try creating a product with a duplicate SKU (e.g. `SR-001`) → you get a clean "That sku already exists" error, not a crash.
7. Click into a product → see its detail page with stock-by-location (empty for now) and an Edit button.

## Common errors

- **`EADDRINUSE` on port 4000 or 5173** — something else is already using that port. Stop it, or change `PORT` in `server/.env` (and update the proxy target in `client/vite.config.ts` to match).
- **`Cannot find module '@prisma/client'`** — you skipped `npx prisma generate`. Run it inside `server/`.
- **Login page loads but clicking Sign in does nothing / network error** — the backend (Terminal 1) isn't running, or isn't on port 4000.
- **CORS error in the browser console** — make sure you're opening the frontend at `http://localhost:5173` (not `127.0.0.1`), since that's what `CLIENT_ORIGIN` in `server/.env` expects.

## What's next (Hour 3 per the plan)

Stock model wiring + Receipts (create, save draft, validate — the first operation that actually writes to Stock and StockLedger).
