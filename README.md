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

## Phase 4.2 Extension Identity Service Contract

- Endpoint: `GET /api/v1/user/status`
- Query (optional): `userId`, `email`
- Origin policy: Request `Origin` must be listed in `ALLOWED_EXTENSION_ORIGINS`

Success response:

```json
{
	"status": "FREE",
	"link": "https://facebook.com/your-admin-page"
}
```

Error responses:

- `403` `{ "error": "Origin not allowed", "code": "ORIGIN_NOT_ALLOWED" }`
- `400` `{ "error": "Invalid query parameters", "code": "INVALID_QUERY" }`
- `500` `{ "error": "Internal server error", "code": "INTERNAL_ERROR" }`

Recommended extension handling:

1) If `status === "PRO"` => unlock PRO features immediately.
2) If `status === "FREE"` and `link` exists => show Upgrade CTA.
3) If `403` => verify Extension ID in `ALLOWED_EXTENSION_ORIGINS`.
4) If `400/500` => show retry-safe fallback UI and log error code.

## Next Phases

- Phase 2: Prisma schema + Better Auth integration + Google provider
- Phase 3: User dashboard + Admin cockpit (manual subscription approval)
- Phase 4: Extension bridge APIs + strict CORS for extension origin

## Notes

- โปรเจกต์นี้ตั้งใจให้เป็น Hub แยกจาก extension เพื่อขยายระบบสมาชิกและการจ่ายเงินได้ง่ายในอนาคต
- ดูภาพรวมสถาปัตยกรรมที่ `project_map.md`
