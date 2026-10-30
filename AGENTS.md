# DESTALION — Agent Development Constitution & Operational Rules

## 1. Project Overview & Role
**DESTALION** (Brewster Creative) is an experimental multimedia art studio and high-touch client commission management portal created for multimedia artist and brand designer Brewster Cabando.

The application combines:
- A public editorial portfolio, services index, and case-study showcase.
- An interactive client portal for project intake, real-time messaging, milestone progression tracking, GCash payment verification, and secure archival deliverable downloads.
- A studio director administration console for milestone management, proof reviews, payment verification, and deliverable publishing.
- **DESTALION Creative Studio**: An administrative design studio application launched via `Settings -> Edit Website` allowing visual design token inspection, responsive device previewing, and layout document prototyping.

---

## 2. Framework & Architecture Standards
- **Core Runtime**: React 19 (`react: ^19.0.1`, `react-dom: ^19.0.1`) with TypeScript 5.8 (`typescript: ~5.8.2`).
- **Build System**: Vite 6 (`vite: ^6.2.3`, `@vitejs/plugin-react: ^5.0.4`).
- **Styling Architecture**: Tailwind CSS v4 (`@tailwindcss/vite: ^4.1.14`, imported via `@import "tailwindcss";` in `src/index.css`). No inline styles or auxiliary CSS modules.
- **Backend / BaaS**: Supabase (`@supabase/supabase-js: ^2.115.0`) providing PostgreSQL database, Row Level Security (RLS), private Storage buckets, Realtime publications, and Auth sessions.
- **Icons**: Lucide React (`lucide-react: ^0.546.0`).
- **Animation**: Motion (`motion: ^12.23.24`).
- **Dev Server Port**: Strictly port `3000` (`0.0.0.0`).

---

## 3. Available Commands & Verification Tooling
Every code modification must be verified using the actual repository tools:

| Command | Script Invocation | Purpose |
| :--- | :--- | :--- |
| **Acceptance Suite** | `npm run test:acceptance` | Executes 105 automated invariant tests (`scripts/test-acceptance.ts`) validating lifecycle stages, payment security, GCash validation, XSS prevention, and token logic. |
| **TypeScript Check** | `npm run lint` | Runs `tsc --noEmit` to verify type safety and import integrity across all `.ts` and `.tsx` source files. |
| **Production Build** | `npm run build` | Compiles Vite production bundle into `dist/` and syncs to `build/`. |
| **Development Server** | `npm run dev` | Boots local development server on port 3000 (`vite --port=3000 --host=0.0.0.0`). |
| **Clean Build** | `npm run clean` | Purges local `dist/` and `build/` directories. |

---

## 4. Fundamental Rules for AI Agents (Google AI Studio & Claude Code)

### A. Inspect Before Modifying
- **Never guess or assume**: Always inspect the actual source code (`src/App.tsx`, `src/context/AppContext.tsx`, `src/lib/`, `supabase/`) before creating or editing files.
- Distinguish between **repository source facts** and **live database state**. You cannot assume the remote Supabase database matches repository migration files unless verified against live database metadata.
- Distinguish editor-only code from shared components needed by client or public interfaces.

### B. Strict Rule on Test Execution & Verification
- **Never claim a test passed unless it was actually executed**: Do not hallucinate test passes, exit codes, or compiler outputs.
- Run `npm run test:acceptance`, `npm run lint`, and `npm run build` to observe true exit codes (`0` for success).
- Always report real command outcomes and failure diagnostics accurately.

### C. Zero Destruction & Preservation Principle
- **Do not rewrite or recreate working features**: Never replace working components just to make the code look cleaner or conform to generic templates.
- **Do not drop tables, alter live schemas, or apply migrations without human approval**: Migration scripts in `supabase/` are additive staging files designed for operator review.
- **Do not invent database columns**: `public.commissions` and `public.commission_payment_proofs` have confirmed schemas. Do not assume imaginary columns (e.g. `deposit_percentage` or `storage_path`) exist.

---

## 5. Security & Payment Invariants

### 1. Final Deliverable Access Conjunction
Clients are strictly locked out of downloadable final deliverables unless **BOTH** conditions evaluate to true:
```
payment_status = 'Paid' AND total_paid = true
```
- In frontend UI: Evaluated in `src/components/FinalDeliverySection.tsx` (`commission.paymentStatus === 'Paid' && commission.totalPaid === true`) and `src/lib/deliverables.ts`.
- In database RLS: Evaluated in table policy on `public.commission_deliverables` and storage policy on `storage.objects` for bucket `'final-deliverables'`.

### 2. Payment-State Anti-Downgrade & Sequence Protection
In `public.admin_review_payment_proof`:
- **Deposit receipts** can NEVER mark a commission fully paid (`'Paid'`). Deposits only transition to `'Partial'`.
- **Deposit receipts** cannot be confirmed if the commission is already fully paid or if `deposit_paid = true`.
- **Balance receipts** strictly require `deposit_paid = true`.
- **Balance receipts** cannot downgrade or alter an already `'Paid'` commission.
- **Full payment receipts** cover 100% upfront; cannot be approved if a deposit was already confirmed.

### 3. GCash Reference Number Uniqueness
- Active receipts (`status IN ('pending_verification', 'confirmed')`) enforce unique reference numbers using canonical normalization:
  `lower(regexp_replace(trim(reference_number), '[\s\-]', '', 'g'))`
- Rejections release the reference number so the client can correct errors.

### 4. Storage Bucket Boundaries
- `final-deliverables`: Private. 100MB limit. Download via 600-second signed URLs only. Gated by payment conjunction and commission ownership.
- `payment-proofs`: Private. 10MB limit. Restricted to receipt images (JPEG, PNG, WebP).
- `chat-attachments`: Private. 25MB limit. SVG files are **strictly forbidden** to prevent stored XSS attacks.
- `portfolio-media`: Public read.

### 5. Sensitive Data Exposure Discipline
- Never output real API keys, Supabase service-role secrets, or production credentials in chat, code, or documentation files.
- Use only `.env.example` placeholders (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `APP_URL`).
