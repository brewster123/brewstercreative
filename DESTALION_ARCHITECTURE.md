# DESTALION — Technical Architecture Specification

## 1. High-Level System Architecture

DESTALION is built as a single-page application (SPA) using React 19 and Vite 6, backed by Supabase for serverless relational persistence, authentication, real-time messaging, and private object storage.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DESTALION Client SPA                         │
│  (React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4 + Motion)       │
├────────────────────────────────────────────────────────────────────────┤
│                          Application Context                           │
│     (src/context/AppContext.tsx — Central State & Data Syncer)         │
├──────────────────┬───────────────────┬─────────────────────────────────┤
│   Public Views   │  Client Workspace │     Admin Production Console    │
│  (Home, Portfolio│ (Intake, Timeline,│   (Commissions, GCash Approval, │
│  Services, Shop) │  Receipts, Files) │    Deliverables, Studio CMS)    │
└─────────┬────────┴─────────┬─────────┴────────────────┬────────────────┘
          │                  │                          │
          ▼                  ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase Cloud Platform                         │
│ ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│ │  PostgreSQL Database    │  │        Private Storage Buckets       │ │
│ │  - public.commissions   │  │  - final-deliverables (100MB, Gated) │ │
│ │  - payment_proofs       │  │  - payment-proofs (10MB, Images)     │ │
│ │  - deliverables         │  │  - chat-attachments (25MB, No SVG)  │ │
│ │  - messages, profiles   │  │  - portfolio-media (Public Read)     │ │
│ └───────────┬─────────────┘  └──────────────────┬───────────────────┘ │
│             │                                   │                     │
│ ┌───────────┴─────────────┐  ┌──────────────────┴───────────────────┐ │
│ │   Row Level Security    │  │     Supabase Realtime & WebSockets   │ │
│ │  - Owner & Admin RLS    │  │  - Live notifications & messages     │ │
│ │  - Conjunction Gates    │  │  - Live commission updates           │ │
│ └─────────────────────────┘  └──────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & File Organization

```
/
├── .env.example                       # Declared environment variable placeholders
├── package.json                       # Scripts, dependencies, devDependencies
├── tsconfig.json                      # Strict TypeScript compiler options
├── vite.config.ts                     # Vite build & Tailwind CSS plugin configuration
├── metadata.json                      # AI Studio capabilities and applet identity
├── index.html                         # SPA HTML entry point
├── scripts/
│   └── test-acceptance.ts             # 105 automated invariant tests
├── supabase/                          # Database migrations & SQL specifications
│   ├── migration_phase_5c_final_delivery.sql
│   ├── migration_phase_5d_chat_attachments.sql
│   ├── migration_phase_5e_1_commissions.sql
│   ├── migration_phase_5h_gcash_payments.sql
│   ├── migration_phase_5i_commission_deliverables.sql
│   └── migration_phase_6_payment_security_remediation.sql
└── src/
    ├── main.tsx                       # React DOM mount point
    ├── App.tsx                        # View router, database banner, role gates
    ├── index.css                      # Tailwind v4 setup & theme CSS variables
    ├── types.ts                       # Complete domain TypeScript models & enums
    ├── context/
    │   └── AppContext.tsx             # Central state machine (2700+ lines)
    ├── views/
    │   ├── HomeView.tsx               # Editorial landing page & featured hero
    │   ├── PortfolioView.tsx          # Filterable project gallery & likes
    │   ├── CaseStudyView.tsx          # Deep-dive project breakdown
    │   ├── ServicesView.tsx           # Service tiers & intake pre-selection
    │   ├── CommissionFormView.tsx     # Project brief submission wizard
    │   ├── ClientDashboardView.tsx    # Client workspace & stage progression
    │   ├── AdminDashboardView.tsx     # Director console (Commissions, Payments)
    │   ├── CreativeStudioView.tsx     # Dedicated website design studio app
    │   ├── ChatView.tsx               # Real-time client-studio chat
    │   ├── ShopView.tsx               # Studio digital prints & merch
    │   ├── ProductDetailView.tsx      # Shop product detail & purchase
    │   ├── SettingsView.tsx           # Preferences, profile, "Edit Website"
    │   └── AuthView.tsx               # Supabase Auth sign-in & registration
    ├── components/
    │   ├── Navbar.tsx                 # Sticky navigation with notification bell
    │   ├── Footer.tsx                 # Studio footer & contact links
    │   ├── ClientPaymentVerificationCard.tsx  # GCash receipt upload & budget math
    │   ├── AdminPaymentVerificationSection.tsx # Receipt review & locked settlement
    │   ├── FinalDeliverySection.tsx   # Client deliverable download portal
    │   ├── AdminDeliverablesSection.tsx# Admin deliverable upload & management
    │   ├── ChatWindow.tsx             # In-page chat component
    │   ├── NotificationPanel.tsx      # Slide-out notification center
    │   ├── PortfolioCard.tsx          # Visual card with likes & view stats
    │   ├── PortfolioModal.tsx         # Quick-view project overlay
    │   └── studio-editor/             # Creative Studio subcomponents
    ├── data/
    │   ├── commissionsData.ts         # Supabase commission queries & mappers
    │   ├── initialData.ts             # Fallback demo state (cleared for production)
    │   └── shopData.ts                # Digital print catalog data
    ├── lib/
    │   ├── supabase.ts                # Client initialization & env checks
    │   ├── payments.ts                # Receipt upload, budget parser, review RPC
    │   ├── deliverables.ts            # Deliverables fetch, upload, signed URLs
    │   ├── messages.ts                # Real-time messages & chat sync
    │   ├── notifications.ts           # In-app notifications engine
    │   ├── studioContent.ts           # CMS services & portfolio CRUD
    │   ├── chatAttachments.ts         # Attachment validation & upload (No SVG)
    │   └── portfolio.ts               # Like/view tracking & analytics
    └── utils/
        ├── dateUtils.ts               # Relative time & formatted dates
        ├── fontLoader.ts              # Plus Jakarta Sans loader
        └── urlUtils.ts                # Sanitized external link validator
```

---

## 3. Routing & State Flow

DESTALION uses a single-page view router coordinated by `activeView` in `AppContext`:
```ts
export type AppView = 
  | 'home'
  | 'portfolio'
  | 'services'
  | 'commission-form'
  | 'client-dashboard'
  | 'admin-dashboard'
  | 'auth'
  | 'shop'
  | 'product-detail'
  | 'settings'
  | 'chat'
  | 'case-study'
  | 'creative-studio';
```

### Authorization Boundaries:
1. **Public Views**: `home`, `portfolio`, `services`, `shop`, `product-detail`, `case-study`, `auth`.
2. **Client Views**: `client-dashboard`, `commission-form`, `chat`.
   - Requires authenticated user. If unauthenticated, displays prompt or redirects to `auth`.
3. **Admin-Only Views**: `admin-dashboard`, `creative-studio`.
   - Strictly requires `currentUser?.role === 'admin'`.
   - If accessed by non-admin or unauthenticated visitor, renders high-fidelity access restriction screen with redirect options.
4. **Dedicated App Shell**:
   - `creative-studio` runs in its own full-screen canvas shell (`h-screen w-screen overflow-hidden bg-[#09090B]`), bypassing standard `Navbar` and `Footer`.

---

## 4. Supabase Integration Details

### Tables
| Table Name | Key Columns | Purpose |
| :--- | :--- | :--- |
| `public.profiles` | `id`, `name`, `email`, `role`, `avatar`, `handle` | User account profiles; roles: `'client'` or `'admin'`. |
| `public.commissions` | `id`, `client_id`, `budget`, `currency`, `payment_status`, `deposit_paid`, `total_paid`, `status` | Commission records and 8-stage lifecycle tracking. |
| `public.commission_payment_proofs` | `id`, `commission_id`, `client_id`, `amount`, `payment_type`, `reference_number`, `status` | Client GCash receipt uploads and admin review records. |
| `public.commission_deliverables` | `id`, `commission_id`, `uploaded_by`, `file_name`, `file_path`, `file_size`, `version` | Master delivery files metadata. |
| `public.commission_messages` | `id`, `commission_id`, `sender_id`, `message`, `attachment_path` | Real-time project chat messages. |
| `public.notifications` | `id`, `user_id`, `title`, `message`, `type`, `is_read` | User notification events. |
| `public.studio_profile` | `gcash_account_name`, `gcash_account_number`, `gcash_instructions` | Dynamic GCash account and studio configuration. |

### Storage Buckets & Policies
1. `final-deliverables`:
   - Access: Private.
   - Client access requires: `c.client_id = auth.uid() AND c.payment_status = 'Paid' AND c.total_paid = true`.
   - Path format: `{commission_id}/{deliverable_uuid}/{sanitized_filename}`.
   - Download validity: 600-second signed URLs.
2. `payment-proofs`:
   - Access: Private.
   - Allowed MIME: `image/jpeg`, `image/png`, `image/webp`. 10MB limit.
   - Path format: `{commission_id}/{proof_id}_{timestamp}.{ext}`.
3. `chat-attachments`:
   - Access: Private.
   - SVG strictly forbidden to prevent stored script injection. 25MB limit.

---

## 5. Environment Variables

The application relies only on standard environment variable placeholders (values must remain confidential in `.env.local` or Cloud secrets):
- `VITE_SUPABASE_URL`: Endpoint of the Supabase project.
- `VITE_SUPABASE_ANON_KEY`: Public anonymous API key for browser client.
- `GEMINI_API_KEY`: Server-side API key for Google GenAI operations.
- `APP_URL`: Canonical URL of the hosted application.

---

## 6. Implementation Constraints & Guardrails
- **Port 3000**: Dev server must run on port 3000 (`0.0.0.0`).
- **No window.alert / window.open**: Browser modal popups are blocked by iframe sandboxes; use in-app dialogs and custom lightboxes.
- **Client-Side GCash Math**: Commission budget must be positive and finalized. Unfinalized budgets (`"TBD"`, `"Flexible"`, ranges) disable receipt upload.
- **Non-Destructive Migrations**: All migration files in `supabase/` are additive. No automatic drops or destructive overwrites of historical rows.
