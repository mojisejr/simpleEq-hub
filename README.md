# SimpleEq Hub

Backend ecosystem สำหรับ SimpleEq Chrome Extension

## Phase 1 Foundation (Completed)

- Next.js (App Router) + TypeScript + Tailwind + ESLint
- Dependencies พร้อมสำหรับ phase ถัดไป:
	- `prisma`, `@prisma/client`
	- `better-auth`
	- `zod`
	- `lucide-react`
- Oracle baseline setup:
	- `.env.example`
	- `.gitignore` (รวม `ψ/` และ secrets)
	- `project_map.md`

## Getting Started

1) ติดตั้ง dependency

```bash
npm install
```

2) สร้าง environment file

```bash
cp .env.example .env
```

3) รัน local dev server

```bash
npm run dev
```

เปิดที่ http://localhost:3000

## Quality Gates

```bash
npm run build
npm run lint
```

## Next Phases

- Phase 2: Prisma schema + Better Auth integration + Google provider
- Phase 3: User dashboard + Admin cockpit (manual subscription approval)
- Phase 4: Extension bridge APIs + strict CORS for extension origin

## Notes

- โปรเจกต์นี้ตั้งใจให้เป็น Hub แยกจาก extension เพื่อขยายระบบสมาชิกและการจ่ายเงินได้ง่ายในอนาคต
- ดูภาพรวมสถาปัตยกรรมที่ `project_map.md`
