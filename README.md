# Dubkin CRM — מערכת ניהול לקוחות

<div align="center">

![Dubkin CRM](https://img.shields.io/badge/Dubkin-CRM-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**CRM מותאם אישית עבור Technology Partner — ניהול לידים, עסקאות, פייפליין מכירות ו-follow-ups**

[🚀 Quick Start](#quick-start) · [📡 API Docs](#api-endpoints) · [🗂 Pipeline](#pipeline-stages) · [🐛 Report Bug](../../issues/new?template=bug_report.md)

</div>

---

## 📋 Overview | סקירה כללית

**Dubkin CRM** is a custom-built customer relationship management system tailored for **Mordechai Dubkin — Technology Partner**, a business consulting firm helping growing companies adopt technology.

**Dubkin CRM** הינו מערכת ניהול לקוחות (CRM) מותאמת אישית עבור **מרדכי דובקין — Technology Partner**, המתמחה בסיוע לעסקים צומחים לאמץ טכנולוגיה.

### ✨ Key Features | תכונות עיקריות

| Feature | תכונה |
|---------|--------|
| 📇 Contact Management | ניהול אנשי קשר ולידים |
| 💼 Deal Tracking | מעקב עסקאות ומכירות |
| 🗂 Sales Pipeline | פייפליין מכירות ויזואלי |
| 🔔 Follow-Up Reminders | תזכורות אוטומטיות לכל עסקה |
| 📊 Activity Log | לוג פעילויות ואינטראקציות |

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js 18+ · Express.js · REST |
| **Database** | PostgreSQL 16 (Dockerized) |
| **Frontend** | Next.js 14 · TypeScript · Tailwind CSS |
| **Infrastructure** | Docker · Docker Compose |

---

## 📁 Project Structure

```
dubkin-crm/
├── backend/                  ← Node.js REST API
│   ├── src/
│   │   ├── app.js            ← Express entry point
│   │   ├── routes/
│   │   │   ├── contacts.js   ← Contacts & leads
│   │   │   ├── deals.js      ← Deals management
│   │   │   ├── pipeline.js   ← Sales pipeline
│   │   │   ├── follow-ups.js ← Follow-up reminders
│   │   │   └── activities.js ← Activity log
│   │   └── db/
│   │       └── index.js      ← PostgreSQL connection pool
│   ├── sql/
│   │   └── schema.sql        ← Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/                 ← Next.js dashboard
│   ├── src/
│   │   ├── app/
│   │   └── components/
│   ├── next.config.js
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites | דרישות מקדימות

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [Node.js 18+](https://nodejs.org/) (for local development)
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/motti770/dubkin-crm.git
cd dubkin-crm
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
nano .env
```

### 3. Start with Docker Compose

```bash
# Start database + API
docker compose up -d

# Check logs
docker compose logs -f

# Stop
docker compose down
```

The API will be available at **http://localhost:3000**

### 4. Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## 📡 API Endpoints

### Contacts | אנשי קשר

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Create new contact |
| `GET` | `/api/contacts/:id` | Get contact by ID |
| `PUT` | `/api/contacts/:id` | Update contact |
| `DELETE` | `/api/contacts/:id` | Delete contact |

### Deals | עסקאות

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/deals` | List all deals |
| `POST` | `/api/deals` | Create new deal |
| `GET` | `/api/deals/:id` | Get deal by ID |
| `PUT` | `/api/deals/:id` | Update deal |
| `DELETE` | `/api/deals/:id` | Delete deal |

### Pipeline | פייפליין

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pipeline` | Get pipeline view (all stages) |
| `PUT` | `/api/pipeline/:dealId/stage` | Move deal to stage |

### Follow-Ups | תזכורות

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/follow-ups` | List follow-ups |
| `POST` | `/api/follow-ups` | Create follow-up reminder |
| `PUT` | `/api/follow-ups/:id` | Update / complete follow-up |
| `GET` | `/api/follow-ups/upcoming` | Get upcoming reminders |

### Activities | פעילויות

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activities` | List all activities |
| `POST` | `/api/activities` | Log new activity |

---

## 🗂 Pipeline Stages

The CRM uses a 6-stage sales pipeline:

```
Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost
ליד  →   מוסמך  →  הצעה   →  משא ומתן  →    נסגר ✅  →   נסגר ❌
```

| Stage | Hebrew | Description |
|-------|--------|-------------|
| `lead` | ליד | Initial contact / new lead |
| `qualified` | מוסמך | Qualified prospect |
| `proposal` | הצעה | Proposal sent |
| `negotiation` | משא ומתן | Active negotiation |
| `closed_won` | נסגר (הצלחה) | Deal won 🎉 |
| `closed_lost` | נסגר (אבד) | Deal lost |

---

## 📸 Screenshots

> Screenshots coming soon — frontend dashboard in development

```
┌─────────────────────────────────────────────────┐
│  Dubkin CRM Dashboard                           │
├──────────┬──────────┬──────────┬────────────────┤
│   Lead   │Qualified │ Proposal │  Negotiation   │
│    (3)   │   (5)   │   (2)    │     (1)        │
├──────────┼──────────┼──────────┼────────────────┤
│ Contact A│Contact B │Contact D │  Contact F     │
│ ₪50,000  │ ₪80,000  │ ₪120,000 │  ₪200,000      │
└──────────┴──────────┴──────────┴────────────────┘
```

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request using the PR template

See [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

---

## 📄 License

MIT — Built for Mordechai Dubkin, Technology Partner 🚀
