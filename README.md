# PrepGo v2

PrepGo v2 is a modern SAT prep app built with Next.js, TypeScript, Tailwind CSS, and Neon PostgreSQL.

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Neon PostgreSQL (`@neondatabase/serverless`)
- Authentication with `bcryptjs` + `jose` (JWT in HTTP-only cookies)

## Features implemented

- User registration (`/register`)
- User login (`/login`)
- Current-session lookup (`/api/auth/me`)
- Logout endpoint that clears auth cookie (`/api/auth/logout`)
- Protected dashboard (`/home`)
- DB-only practice sessions (`/practice`) with 10 questions for Reading/Writing or Math
- Profile editor (`/profile`)
- PostgreSQL setup script for core tables

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
DATABASE_URL="your_neon_connection_string"
JWT_SECRET="your_random_secret"
```

3. Initialize database tables:

```bash
npm run setup-db
```

4. Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run setup-db` — create required DB tables

## Database tables

`users`, `scores`, `posts`, `questions` are created by `scripts/setup-db.ts`.
