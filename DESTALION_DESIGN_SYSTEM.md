# DESTALION — Design System Specification

## 1. Aesthetic Philosophy & Brand Identity: Experimental Editorial Studio
DESTALION is an **independent experimental multimedia art and brand design studio**. Its aesthetic direction avoids sterile, generic corporate agency templates, repetitive SaaS dashboards, and uninspired cookie-cutter cards.

The revised visual direction is guided by **Experimental Editorial Studio** principles:
- **Broadsheet Pacing & Scale Contrasts**: Alternating between open broadsheet typography, high-impact asymmetrical image compositions, and focused functional workspaces.
- **Atmospheric Depth**: A velvety near-black canvas (`#09090B`) as the primary visitor experience that frames creative artwork like a museum exhibition catalog or dark atelier.
- **Expressive Editorial Typography**: Oversized display headlines, intentional line wraps, and bold scale contrasts rather than relying solely on tiny uppercase letter-spaced labels.
- **High-Contrast Energy**: Intense, deliberate bursts of studio orange (`#EA580C`) accentuating interactive actions and live status indicators.
- **Selective Handmade & Architectural Accents**: Occasional handwritten notes (`Caveat`), architectural crop/grid textures, washi-tape mount touches, or notched folder tabs used intentionally where they contribute meaning—never applied as uniform wallpaper across every screen.
- **Flexibility over Rigid Monotony**: Consistency should never force every page or component to look identical. Component geometry (rounded, square, notched, bordered, or borderless) is chosen purposefully to serve the composition and functionality.

---

## 2. Core Color Palette Tokens & Theme Default

### Theme Initialization Rule
- **First-Time Visitors Default to Dark Mode**: The default experience for any visitor without a saved preference is the immersive dark atelier (`#09090B`).
- **Persistence**: Returning visitors' explicit selections are strictly preserved under `localStorage.getItem('brewster_theme')` (`'dark'`, `'light'`, or `'system'`).
- **Zero-Flash Execution**: Theme initialization executes synchronously in `<head>` of `index.html` before DOM render to prevent theme flashing.

### Primary Studio Tokens (Dark Mode — Primary Default Experience)
| Token Name | Hex Value | CSS Variable | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#09090B` | `--bg-canvas` / `--color-canvas` | Deepest root viewport background (zinc-950 depth) |
| **Primary Surface** | `#121214` | `--bg-surface` / `--color-surface` | Elevated card surfaces, containers, dialog panels |
| **Secondary Surface** | `#18181B` | `--bg-surface-secondary` | Recessed controls, nested card insets, input fields |
| **Accent Orange** | `#EA580C` | `--accent` / `--color-terracotta` | Primary brand accent (Tailwind orange-600) |
| **Accent Hover** | `#D94814` | `--accent-hover` / `--color-terracotta-dark` | Interactive active/hover state for accent elements |
| **Primary Typography** | `#FFFFFF` / `#EDEDEC` | `--text-primary` / `--color-carbon` | High-contrast headings and primary labels |
| **Muted Typography** | `#A1A1AA` | `--text-muted` / `--color-graphite` | Secondary labels, captions, metadata tags (zinc-400) |
| **Subtle Border** | `#222225` / `#27272A` | `--border-subtle` / `--color-hairline` | 1px hairline dividers, card frames, structural grids |

### Secondary Light Mode Tokens (Archival Catalog Experience)
| Token Name | Hex Value | CSS Variable | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#FAF9F6` | `--bg-canvas` | Natural off-white gallery paper canvas |
| **Primary Surface** | `#FFFFFF` | `--bg-surface` | Pure white cards and raised panels |
| **Secondary Surface** | `#F4F2ED` | `--bg-surface-secondary` | Neutral cream background for inputs and secondary areas |
| **Primary Typography** | `#18181B` | `--text-primary` | Deep carbon black for sharp editorial legibility |
| **Muted Typography** | `#71717A` | `--text-muted` | Mid-tone graphite grey for metadata |
| **Subtle Border** | `#E4E2DC` | `--border-subtle` | Warm paper hairline divider |

### Status & Feedback Tokens
- **Success / Confirmed**:
  - Dark: Text `#34D399` (`emerald-400`), Surface `#064E3B` (`emerald-950/40`), Border `#065F46`.
  - Light: Text `#047857`, Surface `#ECFDF5`, Border `#A7F3D0`.
- **Warning / Review Required**:
  - Dark: Text `#FBBF24` (`amber-400`), Surface `#78350F` (`amber-950/40`), Border `#92400E`.
  - Light: Text `#B45309`, Surface `#FFFBEB`, Border `#FDE68A`.
- **Error / Rejected**:
  - Dark: Text `#F87171` (`red-400`), Surface `#4C0519` (`red-950/40`), Border `#9F1239`.
  - Light: Text `#B91C1C`, Surface `#FFF1F2`, Border `#FECDD3`.

---

## 3. Typography Hierarchy

DESTALION enforces a single permanent font family standard across all interfaces: **Plus Jakarta Sans** (`font-sans`, `font-display`, `font-mono`).

```css
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Typographic Scales & Usage
1. **Hero Headline**:
   - `text-3xl` to `text-6xl` (`font-black`, `tracking-tight`, `leading-[1.06]`).
   - Sentence casing with editorial emphasis (`text-wrap: balance`).
2. **Section Headings (H2)**:
   - `text-2xl` to `text-3xl` (`font-bold`, `tracking-tight`).
   - Accompanied by a leading 6px accent square or numeric badge (`01`, `02`).
3. **Card Titles & Subsection Headers (H3)**:
   - `text-lg` to `text-xl` (`font-bold`, `text-[#EDEDEC]`).
4. **Metadata & Status Tags**:
   - `text-[10px]` to `text-xs` (`font-mono`, `uppercase`, `tracking-wider`).
   - Used for timestamps, reference codes, service categories, and file formats.
5. **Body Copy**:
   - `text-xs` (compact UI) to `text-sm` / `text-base` (editorial prose).
   - High legibility line-height (`leading-relaxed`), muted color `#A1A1AA`.

---

## 4. Spacing, Geometry & Shadows

### Border Radii Standards
- **Buttons & Interactive Controls**: `rounded-lg` (8px). Touch target min `h-10` (40px) or `h-9` for dense toolbars.
- **Content Cards & Panels**: `rounded-xl` (12px).
- **Modals & Flyouts**: `rounded-2xl` (16px).
- **Metadata Badges & Pills**: `rounded-md` (6px) or `rounded` (4px).
- *Strict Rule*: No bubbly pill-shaped buttons (`rounded-full`) except for status dot indicators and circular avatar frames.

### Elevation Shadows
- In dark mode, depth is established via **subtle hairline borders (`#222225`)** combined with ambient diffusion shadows (`rgba(0, 0, 0, 0.6)`).
- Card surfaces do not use harsh white borders.

---

## 5. Navigation & Component Patterns

### 1. Navigation Header (`src/components/Navbar.tsx`)
- Sticky blurred header with backdrop filter (`backdrop-blur-md`).
- Studio Brand Logo lockup with vector geometry.
- Primary public tabs: *Portfolio*, *Services & Pricing*, *Shop*, *Start Commission*.
- User context area: Notifications bell with unread badge counter, direct workspace link, and theme toggle.

### 2. Client Workspace & Progression Cards
- 8-stage lifecycle tracker showing percentage completion (`10%` to `100%`).
- GCash payment submission card with strict financial calculation (Deposit vs. Remaining Balance).
- File proof review modal with lightbox zoom.
- Deliverable package section with gated signed-URL download anchors.

### 3. Admin Command Console
- Tabbed management console: *Commissions*, *Payment Verification*, *Content CMS*, *Profile*.
- Payment Verification Section: Receipt inspection modal with locked settlement indicators (Partial vs. Paid).
- Creative Studio launch banner in *Settings* view.

---

## 6. Identified Design Inconsistencies & Remediation Roadmap

The codebase inspection reveals the following UI/UX inconsistencies that should be addressed in future visual refinement:

1. **Hardcoded Hex Literals vs. Tailwind Theme Classes**:
   - Multiple files use hardcoded arbitrary classes like `bg-[#18181B]`, `text-[#EDEDEC]`, `border-[#27272A]`, and `bg-[#EA580C]` directly instead of semantic token variables (`var(--bg-surface)`, `var(--accent)`).
   - Recommendation: Consolidate repeated color values to Tailwind utility aliases.
2. **Light Mode Surface Overrides**:
   - `src/index.css` contains extensive `.dark .bg-white !important` override rules to force dark surfaces on legacy light-mode Tailwind classes.
   - Recommendation: Cleanly replace `bg-white dark:bg-[#121214]` in JSX components rather than relying on global CSS overrides.
3. **Contrast on Secondary Metadata**:
   - In some forms, `text-[#71717A]` on `#18181B` approaches WCAG AA contrast threshold (approx 4.5:1).
   - Recommendation: Bump muted text in dark mode to `#A1A1AA` consistently.
4. **Mobile Form Padding**:
   - Commission intake form and GCash receipt upload modal occasionally have cramped horizontal padding on 320px–360px small mobile displays.
   - Recommendation: Standardize minimum `px-4` padding across all viewport sizes.
