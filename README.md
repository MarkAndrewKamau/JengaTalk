# JengaLink — Construction Materials Supply Chain Platform

> **"Fair prices. Fast deliveries. Built for builders."**
>
> Africa's Talking Hackathon 2025 — Grand Prize Entry

[![Backend](https://img.shields.io/badge/Backend-Live-2D9E5C?style=flat-square)](https://jengatalk.onrender.com/api/health)
[![Frontend](https://img.shields.io/badge/Frontend-Live-E87722?style=flat-square)](https://jengatalk-eva6.onrender.com)
![SMS Shortcode](https://img.shields.io/badge/SMS-20880-1C2128?style=flat-square)
![USSD](https://img.shields.io/badge/USSD-*384*880%23-1C2128?style=flat-square)

---

## The Problem

Kenya's construction sector is fragmented and opaque. A contractor in Nairobi buying cement, steel, and roofing sheets has to:

- Call 5–10 different hardware stores to compare prices
- Drive around to verify stock availability
- Negotiate delivery terms separately with each supplier
- Get no notification when materials are delayed or out of stock

Small contractors — *fundis* building residential homes — are most affected. They have no smartphone, no internet, and no leverage. They consistently overpay by 10–20% because they lack price information.

**Suppliers** suffer too: they rely on walk-in traffic, have no digital presence, and spend hours on the phone managing orders and delivery enquiries.

---

## The Solution

JengaLink is a **dual-interface platform** that connects contractors with hardware suppliers through:

1. **SMS & USSD** — works on any phone, no internet required
2. **Web Dashboard** — full management interface for suppliers and contractors with smartphones

A contractor sends one SMS — `PRICE cement nairobi` — and instantly receives prices from verified nearby suppliers. They reply to place an order. The supplier gets notified, confirms, and dispatches. The contractor receives a delivery alert with the driver's name and ETA. All via SMS.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  ┌────────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Supplier Portal│  │ Contractor  │  │ Admin Panel │  │
│  │  (Dashboard)   │  │   Portal    │  │             │  │
│  └────────────────┘  └─────────────┘  └─────────────┘  │
│         https://jengatalk-eva6.onrender.com              │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                    BACKEND                               │
│         https://jengatalk.onrender.com                   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Express.js  │  │  JSON Store  │  │   JWT Auth   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Africa's Talking Services                │  │
│  │   SMS · USSD · Voice · Mobile Money · Airtime      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### SMS Flow (Feature Phone — No Internet Needed)

```text
Contractor                  JengaLink (20880)              Supplier
    │                              │                           │
    │── "PRICE cement nairobi" ───►│                           │
    │                              │ queries supplier DB       │
    │◄── Price list (3 results) ───│                           │
    │                              │                           │
    │── "ORDER BM01 10" ──────────►│                           │
    │                              │── New order SMS ─────────►│
    │◄── Order confirmed #1001 ────│                           │
    │                              │                           │
    │                              │◄── Supplier confirms ─────│
    │◄── "Your order is confirmed"─│                           │
    │                              │                           │
    │                              │◄── Supplier dispatches ───│
    │◄── "Driver: John, 0722..."  ─│                           │
```

### USSD Flow (`*384*880#`)

```
*384*880#
└── Welcome to JengaLink
    ├── 1. Compare Prices
    │   └── Enter material → Select county → See prices → Select supplier
    │       └── Enter quantity → Confirm → Order placed → SMS sent
    ├── 2. Track My Order
    │   └── Enter Order ID → Current status shown
    ├── 3. My Orders
    │   └── Last 3 orders with status
    ├── 4. Set Price Alert
    │   └── Enter material + target price → SMS when price drops
    └── 5. Support
        └── Helpline number displayed
```

---

## Africa's Talking Integration

JengaLink uses five Africa's Talking products:

| Service | Usage |
|---|---|
| **SMS** | Inbound price/order commands, outbound price replies, OTP codes, delivery alerts, order confirmations |
| **USSD** | Full interactive menu — compare, order, track, set alerts — without internet |
| **Voice** | Automated supplier confirmation call for high-value orders (DTMF: press 1 confirm, 2 reject) |
| **Mobile Money** | STK push to contractor phone for payment, weekly B2C payout to suppliers |
| **Airtime** | Loyalty rewards — contractors earn airtime after first 3 completed orders |

### SMS Commands (Shortcode: `20880`)

| Command | Example | Response |
|---|---|---|
| `PRICE [material] [county]` | `PRICE cement nairobi` | Top 3 supplier prices with delivery info |
| `ORDER [code] [qty]` | `ORDER BM01 10` | Order placed, supplier notified |
| `STATUS [order_id]` | `STATUS 1001` | Current order status + supplier |
| `CANCEL [order_id]` | `CANCEL 1001` | Cancels pending/confirmed order |
| `ALERT [material] [price]` | `ALERT cement 700` | SMS alert when price drops below target |
| `MORE` | `MORE` | More results from last price query |
| `HELP` | `HELP` | Full command reference |
| `STOP` | `STOP` | Unsubscribe from all notifications |

### Automated SMS Triggers

These are sent automatically — no action needed from either party:

| Event | Sent To | Message |
|---|---|---|
| Order placed | Supplier | New order details + total amount |
| Order confirmed | Contractor | Confirmation + expected delivery date |
| Order dispatched | Contractor | Driver name, phone, and ETA |
| Order delivered | Contractor | Delivery confirmation + receipt request |
| Low stock | Supplier | Alert when product drops below threshold |
| Price alert triggered | Contractor | Material is now below target price |
| OTP verification | User | 6-digit code, valid 10 minutes |

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Data Store | JSON file store (hackathon MVP), PostgreSQL schema included for production |
| Auth | JWT + OTP via Africa's Talking SMS |
| SMS/USSD/Voice | Africa's Talking SDK |
| Background Jobs | Inline async (Bull/Redis queue for production) |
| Hosting | Render (free tier) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State | Zustand (auth persistence) |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Render Static Site |

---

## Project Structure

```
JengaLink/
├── src/                        # Backend (Node.js/Express)
│   ├── app.js                  # Express app factory
│   ├── server.js               # Server entry point
│   ├── config/
│   │   └── env.js              # Environment configuration
│   ├── db/
│   │   ├── jsonStore.js        # JSON file-based data store
│   │   └── seed.js             # Database seed script
│   ├── middleware/
│   │   ├── auth.js             # JWT + demo-user auth
│   │   └── errors.js           # Error handler + asyncHandler
│   ├── routes/
│   │   ├── auth.js             # Register, verify OTP, login
│   │   ├── suppliers.js        # Supplier CRUD + product listing
│   │   ├── products.js         # Material browse + price compare
│   │   ├── orders.js           # Order lifecycle management
│   │   ├── alerts.js           # Price alert CRUD
│   │   ├── analytics.js        # Dashboard KPIs + revenue stats
│   │   └── webhooks.js         # AT SMS/USSD/Voice/Payments webhooks
│   ├── services/
│   │   ├── smsService.js       # Africa's Talking SMS send/receive
│   │   ├── smsCommandService.js# SMS command parser (PRICE/ORDER/etc)
│   │   ├── ussdService.js      # USSD session state machine
│   │   ├── catalogService.js   # Price comparison engine
│   │   └── orderService.js     # Order creation + status management
│   └── utils/
│       ├── jwt.js              # Token sign/verify
│       ├── otp.js              # OTP generation + expiry
│       ├── phone.js            # E.164 normalisation
│       ├── text.js             # SMS truncation + normalisation
│       └── httpError.js        # Typed HTTP errors
├── db/
│   └── schema.sql              # PostgreSQL schema for production
├── scripts/
│   └── seed.js                 # Seed entry point
├── tests/
│   └── api.test.js             # Node test runner integration tests
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/                # Typed API client layer
│   │   ├── components/         # Shared UI + layout components
│   │   ├── pages/              # Route pages (landing, auth, dashboards)
│   │   ├── stores/             # Zustand auth store
│   │   ├── types/              # TypeScript domain types
│   │   └── utils/              # Formatting helpers
│   ├── public/
│   │   └── _redirects          # Render SPA routing
│   ├── vercel.json             # Vercel deployment config
│   └── vite.config.ts          # Vite + Tailwind v4
├── render.yaml                 # Render Blueprint (frontend + backend)
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- An [Africa's Talking](https://africastalking.com) account (free sandbox available)

### Backend

```bash
# Clone and install
git clone https://github.com/MarkAndrewKamau/JengaTalk.git
cd JengaTalk
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Africa's Talking credentials

# Seed demo data (suppliers, materials, sample orders)
npm run seed

# Start development server (port 4000)
npm run dev
```

#### Environment Variables

```env
NODE_ENV=development
PORT=4000

# Africa's Talking
AT_USERNAME=sandbox          # Your AT username (use 'sandbox' for testing)
AT_API_KEY=                  # Your AT API key from account.africastalking.com
AT_SMS_FROM=                 # Sender ID or shortcode (leave empty for default)

# Auth
JWT_SECRET=change-me-in-production
OTP_TTL_MINUTES=10

# Data
DATA_FILE=./data/jengalink-store.json

# CORS (comma-separated origins for production)
CORS_ORIGINS=https://jengatalk-eva6.onrender.com
```

### Frontend

```bash
cd frontend
npm install

# Development (proxies /api to localhost:4000)
npm run dev

# Production build
npm run build
```

#### Frontend Environment Variables

```env
# .env.production
VITE_API_BASE_URL=https://jengatalk.onrender.com
```

---

## API Reference

### Authentication

All protected endpoints require `Authorization: Bearer <token>`.
For local development, pass `X-Demo-User-Phone: +254711000001` to authenticate as a seeded supplier.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user, sends OTP SMS |
| `POST` | `/api/auth/verify-otp` | Verify OTP, returns JWT |
| `POST` | `/api/auth/login` | Login existing user, sends OTP SMS |
| `POST` | `/api/auth/refresh` | Refresh JWT token |

### Products & Pricing

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Browse all products (filter: `?county=nairobi&q=cement`) | No |
| `GET` | `/api/products/materials` | List all material types | No |
| `GET` | `/api/products/compare` | Price comparison (`?material=cement&county=nairobi`) | No |
| `POST` | `/api/products` | Add product (supplier) | Yes |
| `PUT` | `/api/products/:id` | Update price/stock | Yes |
| `DELETE` | `/api/products/:id` | Remove product (soft delete) | Yes |

### Suppliers

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/suppliers` | List suppliers (filter: `?county=nairobi`) | No |
| `GET` | `/api/suppliers/:id` | Supplier profile + product count | No |
| `GET` | `/api/suppliers/:id/products` | Supplier's full product list | No |
| `POST` | `/api/suppliers` | Create supplier profile | Yes |
| `PUT` | `/api/suppliers/:id` | Update supplier profile | Yes |

### Orders

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/orders` | Place order (supplier + contractor notified via SMS) | No |
| `GET` | `/api/orders` | List orders (role-filtered) | Yes |
| `GET` | `/api/orders/:id` | Order detail with timeline | Yes |
| `PUT` | `/api/orders/:id/status` | Update status (pending→confirmed→dispatched→delivered) | Yes |
| `POST` | `/api/orders/:id/cancel` | Cancel order | Yes |

### Africa's Talking Webhooks

| Method | Endpoint | Handler |
|---|---|---|
| `POST` | `/api/sms/inbound` | Inbound SMS command processor |
| `POST` | `/api/sms/delivery-report` | AT delivery receipt callback |
| `POST` | `/api/ussd` | USSD session handler |
| `POST` | `/api/voice/callback` | DTMF voice confirmation handler |
| `POST` | `/api/payments/callback` | Mobile money payment callback |

### Analytics (Supplier Dashboard)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/overview` | KPIs: orders today, revenue, pending deliveries |
| `GET` | `/api/analytics/products` | Product performance + query counts |
| `GET` | `/api/analytics/revenue` | Revenue by order status |
| `GET` | `/api/analytics/sms` | Inbound/outbound SMS stats |

### Alerts

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/alerts` | Create price alert (triggers SMS when price drops) | No |
| `GET` | `/api/alerts` | List active alerts | Yes |
| `DELETE` | `/api/alerts/:id` | Deactivate alert | Yes |

---

## Deployment

The project ships with a `render.yaml` Blueprint that provisions both services in one click.

### Deploy to Render (Blueprint)

1. Fork the repo on GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your forked repo
4. Render reads `render.yaml` and creates:
   - `jengatalk-backend` — Node.js web service
   - `jengatalk-frontend` — Static site
5. Set these environment variables on the backend service:
   - `AT_USERNAME` — your Africa's Talking username
   - `AT_API_KEY` — your live API key
   - `AT_SMS_FROM` — leave empty (uses AT default sender)
   - `JWT_SECRET` — a strong random secret

### Deploy Frontend Only (Vercel)

```bash
cd frontend
npx vercel --prod
# Set VITE_API_BASE_URL=https://your-backend.onrender.com
```

A `vercel.json` is included with SPA rewrites and asset caching pre-configured.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `#E87722` | CTAs, highlights, active states |
| Secondary | `#1C2128` | Dark backgrounds, sidebar |
| Success | `#2D9E5C` | Confirmed orders, stock available |
| Concrete | `#8B9094` | Muted text, placeholders |
| Display font | **Syne** | Headings, brand |
| Body font | **DM Sans** | All body text |

---

## User Personas

| Persona | Interface | Key Actions |
|---|---|---|
| **Small Contractor / Fundi** | SMS + USSD (feature phone) | Compare prices, place orders, track deliveries |
| **Hardware Supplier** | Web Dashboard | Manage stock, confirm orders, send delivery alerts |
| **Site Supervisor** | Web + SMS | Track multiple project orders, manage budgets |
| **Platform Admin** | Admin Panel | Approve suppliers, monitor disputes, view analytics |

---

## Team

| Role | GitHub |
|---|---|
| Backend & AT Integration | [@MarkAndrewKamau](https://github.com/MarkAndrewKamau) |
| Frontend & Integration | [@JosephNjorog](https://github.com/JosephNjorog) |

---

## Live Demo

| Service | URL |
|---|---|
| **Frontend** | [jengatalk-eva6.onrender.com](https://jengatalk-eva6.onrender.com) |
| **Backend API** | [jengatalk.onrender.com](https://jengatalk.onrender.com/api/health) |
| **SMS** | Send `PRICE cement nairobi` to **20880** |
| **USSD** | Dial **`*384*880#`** |

---

*JengaLink — Kwa wajenzi wa Afrika. For Africa's builders.*
