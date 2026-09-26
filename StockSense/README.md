# StockSense — Full-Stack Inventory Management System

StockSense is a modular, role-based Inventory Management System built with a FastAPI backend, Supabase PostgreSQL, and a React + TypeScript frontend.

---

## Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide Icons
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Uvicorn, Python-Jose (JWT validation)
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)

---

## Prerequisites

Make sure you have installed on your computer:
1. **Node.js** (v18 or higher) and `npm`
2. **Python** (v3.10 or higher) and `pip`
3. A **Supabase project** (Free tier at [supabase.com](https://supabase.com))

---

## 1. Database Setup (Supabase)

1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Run the SQL script located at:
   ```
   server/supabase_schema.sql
   ```
   This creates all tables, enums, triggers, and indices.

---

## 2. Backend Setup (FastAPI)

1. Open a terminal and navigate to `server`:
   ```bash
   cd server
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`)
   - `SUPABASE_ANON_KEY`: Your Supabase Project Anon/Public API Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (from Project Settings -> API)
   - `SUPABASE_JWT_SECRET`: Your Supabase JWT Secret (from Project Settings -> API / Auth)
   - `DATABASE_URL`: PostgreSQL connection string (from Project Settings -> Database)
   - `CORS_ORIGINS`: `http://localhost:5173`

5. *(Optional)* Seed initial data:
   ```bash
   python seed.py
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Backend API will run at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

---

## 3. Frontend Setup (React + Vite)

1. Open a second terminal and navigate to `client`:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` (or `.env.local`) file in `client/`:
   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at:
   ```
   http://localhost:5173
   ```

---

## 4. Key Application Features

- **Authentication**: Sign in, Sign up, session recovery via Supabase Auth + JWT bearer tokens.
- **Role-based Dashboards**: Real-time KPI summaries, stock alert monitors, quick-action shortcuts (Manager vs. Staff).
- **Core Master Data**: Products (SKU, barcode, categories, stock tracking), Categories, Warehouses & Locations.
- **Stock Operations**:
  - **Receipts**: Inbound purchase receipt workflows (Draft → Ready → Done).
  - **Deliveries**: Outbound sales delivery workflows (Draft → Ready → Done) with stock level validation.
  - **Internal Transfers**: Location-to-location inventory movement with live ledger updates.
  - **Adjustments**: Physical cycle count reconciliation.
- **Reordering Rules**: Automated minimum and maximum reorder threshold alerts.
- **Stock Ledger / Audit Log**: Immutable double-entry transaction history tracking every unit movement.
