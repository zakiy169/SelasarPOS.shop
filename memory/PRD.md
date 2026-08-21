# Kedai Kopi Selasar POS - Redesign PRD

## Problem Statement
Existing React 19 + Vite + Supabase POS app for restaurant/cafe. User provided
Delivero design reference and asked for menyeluruh (full app) UI/UX redesign
matching the reference — brand tetap "Kedai Kopi Selasar", tidak menyalin persis.

## Constraints
- JANGAN ubah: Supabase schema, API, business logic transaksi
- BOLEH ubah: struktur komponen frontend, layout, CSS, UX interaksi

## Architecture
- Frontend: React 19 + Vite 8
- Backend: Supabase (auth + Postgres + Realtime)
- Design system: `src/styles/pos-delivero.css` (scoped `body.pos-delivero-active`)
- Body class toggled globally from `App.jsx`

## Design Tokens (Delivero-inspired for Selasar)
- Page bg: #ECEAF7 lavender
- Sidebar: dark navy #1B0E3F → #2A1560 gradient
- Sidebar active: yellow #FFD93B pill
- Primary: purple #4B2D8F
- Accent green banner: #4E7A3E → #6BA255
- Card: white #FFFFFF
- Card soft: #F5F3FD
- Text: #1F1B3A
- Text muted: #7C7898

## Completed (Jan 2026)
### Phase 1 — POS Dashboard Redesign
- Sidebar Delivero (dark navy, yellow active, brand "Selasar" italic)
- Header sapaan + search + profile pills (light bg)
- Promo banner "MENU OF THE DAY" (green gradient + orange glow)
- Category chips horizontal with emoji icons (☕ ✨ ⚡ 🫖 🥤 🥐 📦)
- Product grid — white cards, rating stars, purple add button
- Cart panel — purple gradient header, white body, checkout button
- Mobile: bottom sheet cart + bottom nav (light)

### Phase 2 — Global Design System (menyeluruh)
- Login Screen — headline serif italic ("Kerja kedai yang lebih mengalir"),
  purple CTA, white order preview cards
- PIN Gate — clean white card, purple lock icon, soft keypad
- Onboarding — white cards with Delivero orbs
- KDS/Dapur — purple hero, cream/pastel status cards
- Meja & Area — purple hero, table status cards with pill badges
- Reports/Laporan — purple hero, KPI cards, purple bar chart
- Menu Manager, Inventory, Loyalty, Shift, Settings — all use same hero + card system
- Mobile bottom nav — light theme with purple active state
- All modals — white with purple accents
- CSS variables globally redefined so inline var() references cascade

## Files Modified
- `src/styles/pos-delivero.css` (NEW, ~1150 lines)
- `src/main.jsx` (added CSS import)
- `src/App.jsx` (added body class toggle useEffect)
- `src/components/POS/PosScreen.jsx` (added banner, section titles, category icons)

## Files NEW for Preview
- `preview-pos.html` (multi-view preview page)
- `src/preview-pos.jsx` (renders LoginScreen, LoginModal, and all tabs with seed data)

## Not Touched (per user constraints)
- Supabase schema, RLS, RPC functions (`ensure_user_workspace`)
- All auth flow in App.jsx (session sync, membership loading)
- Business logic: transactions, cart calc, stock deduction, shift management
- Modals: PaymentModal, ProductModal, ReceiptModal, TransactionSuccessScreen

## Backlog / Future
- P1: Fine-tune KDS card status colors (cream/purple/green pastels)
- P1: Onboarding screen visual review after actual Supabase account creation
- P2: Dark theme variant of Delivero design (currently light-only)
- P2: Empty states for reports when no transactions
