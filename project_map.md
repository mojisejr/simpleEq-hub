# Project Map — simple-eq-hub

## 1) Philosophy
SimpleEq Hub คือ backend ecosystem สำหรับ Chrome Extension โดยแยกความรับผิดชอบเรื่อง Auth, Subscription, Admin Approval และ API bridge ออกจาก extension เพื่อให้ระบบโตได้แบบปลอดภัยและตรวจสอบย้อนหลังได้

## 2) Key Landmarks
- `app/` — Next.js App Router (UI + route handlers)
- `public/` — static assets
- `.env.example` — ตัวแปรแวดล้อมมาตรฐานสำหรับ local/dev
- `project_map.md` — แผนที่สถาปัตยกรรมและจุดนำทาง
- `package.json` — scripts และ dependency contracts

## 3) Data Flow (Target)
Chrome Extension → Next.js API (`/api/*`) → Auth/Session Layer → Database (Neon + Prisma)

Admin Cockpit จะใช้ flow เดียวกันแต่สิทธิ์สูงกว่า:
Admin UI → Protected API → Approve Subscription → Persist audit log

## 4) Current Territory (Phase 1)
- ✅ Next.js + TypeScript + Tailwind + ESLint scaffolding สำเร็จ
- ✅ Foundation dependencies ติดตั้งแล้ว (`prisma`, `@prisma/client`, `better-auth`, `zod`, `lucide-react`)
- ✅ Oracle setup baseline (`.gitignore`, `.env.example`) พร้อม
- ⏭️ Next: Phase 2 (Prisma schema + Better Auth integration)

## 5) Known Challenges
- Better Auth + Google PKCE สำหรับ extension ต้องออกแบบ callback/cors อย่างระวัง
- Manual payment approval ต้องเก็บ audit trail ที่ตรวจสอบย้อนหลังได้
- CORS policy สำหรับ `chrome-extension://` ต้อง whitelist อย่างเข้ม
