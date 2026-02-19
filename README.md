# Dobkin CRM 🚀

**CRM Backend for Motti Dobkin — Technology Partner for Growing Businesses**

> מוכר אוטומציות, WhatsApp בוטים, ניהול פרויקטים גדולים.

---

## Pipeline מכירות

| שלב | תיאור |
|-----|-------|
| 🌀 צינון       | Lead ראשוני — ליד חדש |
| 🔍 אפיון       | הבנת הצורך והפתרון |
| 💰 מחירה       | הצעת מחיר |
| 🤝 סגירה       | משא ומתן וחתימה |
| ✅ לקוח פעיל   | פרויקט בביצוע |
| 📦 ארכיון      | עסקאות שנסגרו |

---

## הרצה מהירה עם Docker

```bash
# 1. Clone
git clone https://github.com/motti770/dobkin-crm.git
cd dobkin-crm

# 2. הגדרת ENV
cp .env.example .env
# ערוך .env עם הפרטים שלך

# 3. הרצה (DB + API בפקודה אחת!)
docker compose up -d

# 4. בדיקה
curl http://localhost:3000/health
```

השירות עולה על **http://localhost:3000**

---

## API Reference

### Health
```
GET /health
```

### Contacts

| Method | Path | תיאור |
|--------|------|-------|
| GET    | `/contacts` | כל אנשי הקשר (תומך: `?search=`, `?source=`) |
| GET    | `/contacts/:id` | איש קשר ספציפי |
| POST   | `/contacts` | יצירת איש קשר חדש |
| PUT    | `/contacts/:id` | עדכון איש קשר |
| DELETE | `/contacts/:id` | מחיקת איש קשר |

**POST /contacts body:**
```json
{
  "name": "ישראל ישראלי",
  "phone": "050-1234567",
  "email": "israel@company.co.il",
  "company": "חברה בע\"מ",
  "source": "referral",
  "notes": "הגיע דרך דני"
}
```

### Deals

| Method | Path | תיאור |
|--------|------|-------|
| GET    | `/deals` | כל העסקאות (תומך: `?stage=`, `?contact_id=`) |
| GET    | `/deals/:id` | עסקה ספציפית |
| POST   | `/deals` | יצירת עסקה חדשה |
| PUT    | `/deals/:id` | עדכון עסקה |
| PATCH  | `/deals/:id/stage` | העברת עסקה לשלב אחר |
| DELETE | `/deals/:id` | מחיקת עסקה |

**POST /deals body:**
```json
{
  "contact_id": 1,
  "name": "WhatsApp Bot לחברת ביטוח",
  "value": 3500,
  "product_id": 2,
  "notes": "רוצים בוט עם 5 תהליכים",
  "expected_close": "2026-03-15"
}
```

**PATCH /deals/:id/stage body:**
```json
{ "stage_name": "pricing" }
```
שמות השלבים: `lead`, `discovery`, `pricing`, `closing`, `active`, `archive`

### Activities

| Method | Path | תיאור |
|--------|------|-------|
| GET    | `/activities` | כל הפעולות (תומך: `?deal_id=`, `?contact_id=`, `?type=`) |
| POST   | `/activities` | רישום פעולה חדשה |

**POST /activities body:**
```json
{
  "deal_id": 1,
  "contact_id": 1,
  "type": "whatsapp",
  "description": "שלחתי הצעת מחיר ראשונית",
  "occurred_at": "2026-02-19T10:00:00Z"
}
```

סוגי פעולות: `call`, `email`, `whatsapp`, `meeting`, `note`, `other`

### Follow-ups ❤️ (לב ה-CRM)

| Method | Path | תיאור |
|--------|------|-------|
| GET    | `/follow-ups` | כל ה-follow-ups (תומך: `?status=pending`, `?deal_id=`, `?contact_id=`) |
| POST   | `/follow-ups` | יצירת follow-up חדש |
| PATCH  | `/follow-ups/:id/done` | סימון כבוצע ✅ |
| PATCH  | `/follow-ups/:id/snooze` | דחייה לתאריך אחר 💤 |

**POST /follow-ups body:**
```json
{
  "deal_id": 1,
  "contact_id": 1,
  "due_date": "2026-02-22T10:00:00",
  "type": "whatsapp",
  "notes": "לשאול אם קיבל את הצעת המחיר"
}
```

סוגי follow-up: `call`, `whatsapp`, `email`, `meeting`, `other`
סטטוסים: `pending`, `done`, `snoozed`

### Pipeline

```
GET /pipeline
```

מחזיר את כל השלבים עם העסקאות שלהם, ספירה, וסכום כולל בשקלים.

**Response:**
```json
{
  "pipeline": [
    {
      "stage": { "name": "lead", "display_name": "צינון", "color": "#6B7280" },
      "deals": [...],
      "deal_count": 3,
      "total_value": 12000
    }
  ],
  "summary": {
    "total_deals": 12,
    "total_value": 87500
  }
}
```

---

## פריסה ב-Coolify

1. ב-Coolify: **New Resource → Docker Compose**
2. הדבק את תוכן `docker-compose.yml`
3. הוסף את משתני ה-ENV
4. **Deploy!**

---

## פיתוח מקומי (ללא Docker)

```bash
# דרישות: Node.js 18+, PostgreSQL פועל

npm install

# הגדר משתני env (בשורת הפקודה)
export DB_HOST=localhost DB_USER=crm_user DB_PASSWORD=changeme DB_NAME=dobkin_crm

# יצירת Schema
psql -U crm_user -d dobkin_crm -f sql/schema.sql

# הרצה
npm run dev   # עם nodemon (watch mode)
# או
npm start
```

---

## Database Schema

```
pipeline_stages → deals → activities
contacts ─────────┘          │
                  └──────────┘
products → deals
```

---

## Tech Stack

- **Runtime:** Node.js 20 + Express 4
- **Database:** PostgreSQL 16
- **Container:** Docker + Docker Compose
- **Security:** Helmet, CORS
