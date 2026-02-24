# Project Map — simple-eq-hub

## 1) Philosophy
SimpleEq Hub คือ backend ecosystem สำหรับ Chrome Extension โดยแยกความรับผิดชอบเรื่อง Auth, Subscription, Admin Approval และ API bridge ออกจาก extension เพื่อให้ระบบโตได้แบบปลอดภัยและตรวจสอบย้อนหลังได้

## 2) Key Landmarks
- `app/` — Next.js App Router (UI + route handlers)
- `app/admin/` — Admin Cockpit UI + server actions (manual PRO approval)
- `tests/` — test suite ของระบบ (Vitest)
- `public/` — static assets
- `.env.example` — ตัวแปรแวดล้อมมาตรฐานสำหรับ local/dev
- `project_map.md` — แผนที่สถาปัตยกรรมและจุดนำทาง
- `package.json` — scripts และ dependency contracts
- `vitest.config.ts` — test runner config (jsdom + alias support)

## 3) Data Flow (Target)
Chrome Extension → Next.js API (`/api/*`) → Auth/Session Layer → Database (Neon + Prisma)

Admin Cockpit จะใช้ flow เดียวกันแต่สิทธิ์สูงกว่า:
Admin UI → Protected API → Approve Subscription → Persist audit log

## 🔌 Connected Clients (The Body)
- **SimpleEq Extension**: [projects/SimpleEq](projects/SimpleEq)
    - **Integration**: REST API via `fetch`
    - **Auth**: Better Auth (PKCE) / Session Cookie
    - **CORS Role**: Next.js must whitelist extension ID.
    - **Contract**: extension calls `/api/v1/user/status` to determine feature access.

## 4) Current Territory
- ✅ Next.js + TypeScript + Tailwind + ESLint scaffolding สำเร็จ
- ✅ Foundation dependencies ติดตั้งแล้ว (`prisma`, `@prisma/client`, `better-auth`, `zod`, `lucide-react`)
- ✅ Oracle setup baseline (`.gitignore`, `.env.example`) พร้อม
- ✅ Phase 2 Identity Engine สำเร็จ (Better Auth + Prisma 7 + Neon adapter)
- ✅ Bridge endpoint พร้อมใช้งาน (`/api/v1/user/status`)
- ✅ Test infrastructure พร้อมใช้งาน (Vitest + jsdom + tsconfig paths)
- ✅ Phase 3 Admin Cockpit baseline implemented
    - `/admin` dashboard (stat cards, email search, manual approve)
    - Server-side admin guard (session + role check)
    - Atomic approval transaction + persistent audit log
    - Callback-aware login flow for admin redirect
- ✅ Phase 3.1 Admin Quality Gate (Testing & Reliability)
    - Unit tests for server actions and failure paths
    - Hard gate verified (Build/Lint/25 tests passed)
- ⏭️ Next: Phase 4 (Bridge deployment & extension sync)

## 5) Test Suite Structure
- **Runner**: Vitest (`vitest`)
- **Config**: `vitest.config.ts`
    - `environment: "jsdom"`
    - `include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]`
    - Plugins: `@vitejs/plugin-react`, `vite-tsconfig-paths`
- **Test Directory**: `tests/`
    - Current baseline test: `tests/verify.test.ts`
    - Scope: smoke check + path alias resolution (`@/`)

## 6) Test & Quality Commands
- `npm run test` — รันเทสต์ทั้งหมดแบบครั้งเดียว (`vitest run`)
- `npm run test:watch` — รันเทสต์แบบ watch mode (`vitest`)
- `npm run lint` — ตรวจคุณภาพโค้ดด้วย ESLint
- `npm run build` — ตรวจความพร้อมระดับ production build

## 7) Known Challenges
- Better Auth + Google PKCE สำหรับ extension ต้องออกแบบ callback/cors อย่างระวัง
- Manual payment approval ต้องเก็บ audit trail ที่ตรวจสอบย้อนหลังได้
- CORS policy สำหรับ `chrome-extension://` ต้อง whitelist อย่างเข้ม
