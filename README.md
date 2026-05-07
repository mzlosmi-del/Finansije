# Finansije

A simple, mobile-first web app for couples to manage their personal monthly finances together.

## Features

- **Quick add**: amount, category, person who paid, optional note — typically 4 taps to save.
- **Regular monthly & yearly** expenses and revenues (yearly entries are automatically divided by 12 in monthly views).
- **Categories** for both expenses and revenues, fully editable.
- **Per-person + total** calculations for the month and year.
- **Savings targets** for the month and year, with progress bars.
- **History** of all daily entries, grouped by day.
- **Person switcher** in the header — no login required.
- Dark, mobile-first UI with a fixed bottom tab bar.

## Tech

- Next.js 14 (App Router) + React Server Components + Server Actions
- TypeScript + Tailwind CSS
- Prisma + PostgreSQL

## Local development

```bash
cp .env.example .env
# edit .env and set DATABASE_URL to a Postgres database

npm install
npx prisma db push          # creates the tables
npm run db:seed             # seeds 2 members + default categories
npm run dev
```

Open http://localhost:3000.

For local development you can use a free Postgres from [Neon](https://neon.tech) or run one in Docker:

```bash
docker run --name finansije-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# then DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

## Deploy online (easiest path: Vercel + Neon, both free)

1. **Create the Postgres database**
   - Go to <https://neon.tech>, sign up (no credit card).
   - Create a project. Copy the connection string (looks like `postgresql://...?sslmode=require`).

2. **Push this repo to GitHub** (already done if you're reading this from GitHub).

3. **Deploy on Vercel**
   - Go to <https://vercel.com>, sign up with your GitHub.
   - Click *Add New… → Project*, import this repository.
   - Under *Environment Variables*, add:
     - `DATABASE_URL` = the Neon connection string from step 1.
   - Click *Deploy*. The build runs `prisma generate && next build` automatically.

4. **Initialize the database** (one-time)
   - From your laptop, with `.env` pointing at the Neon `DATABASE_URL`:
     ```bash
     npx prisma db push
     npm run db:seed
     ```
   - Done. Open the Vercel URL on your phone and add it to your home screen for an app-like experience.

5. **Rename the members** in *Settings → Members* to your actual names.

## Notes

- All amounts are stored as integer cents to avoid floating-point errors.
- Yearly recurring entries contribute `amount / 12` per month to the dashboard.
- "Who am I" is stored in a cookie, so each phone remembers its own selection.
- Currency and locale are configurable in *Settings*; defaults are EUR / `de-DE`.
