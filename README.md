# Petspace

Petspace is a warm pet-life sharing social platform MVP built with Next.js App Router, Clerk, PostgreSQL, Drizzle, and Aliyun OSS.

## Local Development

Use Node.js `>=20.9.0`.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill:

- `DATABASE_URL` for PostgreSQL.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for Clerk auth.
- `ALIYUN_ACCESS_KEY_ID`, `ALIYUN_ACCESS_KEY_SECRET`, `ALIYUN_OSS_ROLE_ARN`, `ALIYUN_OSS_BUCKET`, `ALIYUN_OSS_REGION`, `ALIYUN_OSS_ENDPOINT`, and optionally `ALIYUN_OSS_PUBLIC_BASE_URL` for OSS browser uploads.

Without those variables, the app renders a clearly marked preview feed and disables real publishing.

Check runtime readiness without exposing secrets:

```bash
curl http://127.0.0.1:3000/api/health
```

## Database

Generate and apply Drizzle migrations:

```bash
npm run db:generate
npm run db:migrate
```

The first migration is in `drizzle/0000_calm_runaways.sql`.

## Deploying to Vercel

Set the same environment variables in Vercel Project Settings. Vercel will auto-detect Next.js and deploy the App Router pages and API route handlers as Vercel Functions.
