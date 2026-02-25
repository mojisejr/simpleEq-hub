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

## Production Env Strategy (Fixed Extension ID)

สำหรับการขายแบบลูกค้าโหลดไฟล์ extension แล้วติดตั้งเอง ให้ใช้แนวทาง Fixed ID:

1) ใส่ `key` แบบคงที่ใน `manifest.json` ฝั่ง extension (ID จะนิ่งทุกเครื่อง)
2) ตั้งค่า Hub ด้วย `ALLOWED_EXTENSION_IDS` เป็น ID 32 ตัวอักษร (ไม่ต้องใส่ prefix)
3) ระบบจะ derive เป็น `chrome-extension://<id>` อัตโนมัติสำหรับ CORS + Better Auth trusted origins

ตัวอย่าง:

```dotenv
ALLOWED_EXTENSION_IDS="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
ALLOWED_EXTENSION_ORIGINS="http://localhost:3000"
BETTER_AUTH_URL="https://your-hub.vercel.app"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-hub.vercel.app"
```

หมายเหตุ:
- สามารถใช้ `ALLOWED_EXTENSION_ORIGINS` ต่อได้สำหรับ Web origins ที่ต้อง allow เพิ่มเติม
- หากตั้งทั้งสองตัวพร้อมกัน ระบบจะรวมให้และตัดค่าซ้ำให้อัตโนมัติ
