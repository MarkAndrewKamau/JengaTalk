# JengaLink Backend

Phase 2 backend for the JengaLink construction materials platform. It exposes the REST API, SMS webhook, and USSD flow described in the hackathon brief.

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

The API starts on `http://localhost:4000` by default. Local data is persisted to `./data/jengalink-store.json`; delete it or run `npm run seed` to reset.
Set `HOST=0.0.0.0` in production containers if your platform requires binding to all interfaces.

## Demo Flow

```bash
curl "http://localhost:4000/api/products/compare?material=cement&county=nairobi"

curl -X POST http://localhost:4000/api/sms/inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+254722123456","to":"20880","text":"PRICE cement nairobi"}'

curl -X POST http://localhost:4000/api/sms/inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+254722123456","to":"20880","text":"ORDER BM01 10"}'

curl -X POST http://localhost:4000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-1","phoneNumber":"+254722123456","text":"1*cement"}'
```

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `GET /api/suppliers`
- `GET /api/suppliers/:id/products`
- `GET /api/products`
- `GET /api/products/materials`
- `GET /api/products/compare?material=cement&county=nairobi`
- `POST /api/orders`
- `PUT /api/orders/:id/status`
- `POST /api/sms/inbound`
- `POST /api/ussd`
- `POST /api/alerts`
- `GET /api/analytics/overview`

Protected endpoints accept `Authorization: Bearer <token>`. For local demos, you can also pass `X-Demo-User-Phone` with one of the seeded users, for example `+254711000001`.

## Africa's Talking

Without `AT_API_KEY`, outbound SMS is mocked but still written to `sms_logs`. Set these in `.env` to send through Africa's Talking:

```bash
AT_USERNAME=sandbox
AT_API_KEY=your-key
AT_SMS_FROM=20880
```

The SMS webhook supports:

- `PRICE cement nairobi`
- `ORDER BM01 10`
- `STATUS 1001`
- `CANCEL 1001`
- `ALERT cement 700`
- `MORE`
- `HELP`
- `STOP`

## Data Layer

The app uses a JSON store for a no-database hackathon demo. The Postgres contract lives in `db/schema.sql` and mirrors the Phase 2 schema for the production adapter.
