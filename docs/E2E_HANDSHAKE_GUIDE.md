# 🛰️ E2E Handshake & Login Guide: SimpleEq Hub ↔️ Extension

เอกสารนี้จะช่วยให้คุณนนท์สามารถทดสอบการเข้าระบบ (Login) และการเชื่อมต่อแบบ End-to-End (E2E) ระหว่าง Chrome Extension และ Hub (Backend) ได้บนเครื่อง Local ครับ

---

## 📋 สิ่งที่ต้องเตรียม (Prerequisites)

1.  **Google Cloud Console Project**: สำหรับทำ Google Login (OAuth 2.0).
2.  **Database**: Neon (PostgreSQL) หรือ Local PostgreSQL สำหรับเก็บข้อมูล User/Session.
3.  **Extension ID**: ID ที่ได้จากการ Load Unpacked ลงที่ Chrome.

---

## 🛠️ ขั้นตอนที่ 1: ติดตั้ง Extension และหา Extension ID

1.  เปิด Chrome ไปที่ `chrome://extensions/`
2.  เปิดโหมด **Developer mode** (มุมขวาบน)
3.  กด **"Load unpacked"** และเลือกโฟลเดอร์ `projects/SimpleEq`
4.  สัญลักษณ์ ⚗️ จะปรากฏขึ้น สังเกตและคัดลอก **ID** (เช่น `abcde...xyz`) **[สำคัญมาก!]**

---

## 🔑 ขั้นตอนที่ 2: ตั้งค่า Google Cloud Console (OAuth)

1.  ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2.  สร้างโครงการใหม่ (หรือใช้โครงการเดิม)
3.  ไปที่ **APIs & Services > Credentials**
4.  สร้าง **OAuth 2.0 Client ID**:
    -   **Application type**: Web application
    -   **Name**: `SimpleEq Hub Dev`
    -   **Authorized JavaScript origins**:
        -   `http://localhost:3000`
    -   **Authorized redirect URIs**:
        -   `http://localhost:3000/api/auth/callback/google`
5.  คัดลอก **Client ID** และ **Client Secret**

---

## 🧪 ขั้นตอนที่ 3: ตั้งค่า Hub `.env` และเริ่ม Server

ไปที่ `projects/simple-eq-hub` และแก้ไขไฟล์ `.env`:

```dotenv
# 1. ฐานข้อมูล
DATABASE_URL="postgresql://..."

# 2. Auth Config
BETTER_AUTH_SECRET="long-random-string" # รัน 'openssl rand -base64 32' เพื่อสร้าง
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# 3. Google OAuth
GOOGLE_CLIENT_ID="จากขั้นตอนที่ 2"
GOOGLE_CLIENT_SECRET="จากขั้นตอนที่ 2"

# 4. Extension Bridge [สำคัญ!]
# ใส่ chrome-extension:// ตามด้วย ID ที่ได้จากขั้นตอนที่ 1
ALLOWED_EXTENSION_ORIGINS="chrome-extension://YOUR_ID_HERE,http://localhost:3000"
PRO_UPGRADE_LINK="http://localhost:3000/auth/login"
```

**รัน Server**:
```bash
cd projects/simple-eq-hub
npm run dev
```

---

## 🔗 ขั้นตอนที่ 4: การเชื่อมต่อ (Handshake Test)

1.  **ใน Chrome**: เปิดหน้า `http://localhost:3000/auth/login` ใน Tab ปกติ
2.  **Login**: กด Login ด้วย Google ให้สำเร็จ
3.  **Check Status**:
    -   เปิด Side Panel ของ SimpleEq (คือกดที่ไอคอน ⚗️)
    -   Badge ด้านบนจะเปลี่ยนจาก `⏳ Checking...` เป็น `🆓 FREE` (ถ้ายังไม่ได้ Approve) หรือ `✅ PRO` (ถ้า Approve แล้ว)
    -   *หมายเหตุ: Chrome Extension จะใช้ Session เดียวกันกับที่ Login ใน Tab ของ Hub โดยอัตโนมัติ (ข้าม Origin)*

---

## 🛡️ การทดสอบ Admin Approve (เปลี่ยน FREE → PRO)

1.  เมื่อ Login ครั้งแรก สถานะจะเป็น `FREE`
2.  ไปที่หน้า `http://localhost:3000/admin` (Hub)
3.  ค้นหา Email ของคุณนนท์
4.  กด **Approve**
5.  **ใน Extension**: ลองปิดและเปิด Side Panel ใหม่ หรือกด Refresh ตัว Extension (ใน `chrome://extensions/`) สถานะจะกลายเป็น `✅ PRO` ทันที!

---
*Created via AI Oracle for คุณนนท์ (Ref: Phase 4.3 Snapshot)*
