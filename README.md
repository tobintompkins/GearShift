# TNT Apex Elite AutoCare - Mobile Mechanic Scheduler

A scheduling application for mobile mechanics to manage jobs, customers, and appointments.

## Features

- Job scheduling with date, time, and duration tracking
- Customer information management
- Vehicle information tracking
- Service type categorization
- Status tracking (pending, in-progress, awaiting-parts, completed, cancelled)
- Employee/Team assignment
- Calendar view (weekly and monthly)
- Automated reminders and notifications (email/SMS)
- Mobile-friendly responsive design

## Prerequisites

- Node.js 18+ installed (includes npm)
- npm or yarn package manager

## Setup (SQLite for quick local run)

1. Install dependencies:
```bash
npm install
```

2. Set up the database (SQLite file):
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14
- TypeScript
- Prisma (PostgreSQL)
- Tailwind CSS
- date-fns

## Database Setup Options

- Default local: SQLite (no extra install). The database file is at `./dev.db`.
- For production, switch to PostgreSQL by changing `provider` and `DATABASE_URL` in `prisma/schema.prisma` and `.env.local`.

## GitHub Setup

1. Create a new repository on GitHub named "GearShift"
2. Initialize git in this directory:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/GearShift.git
git push -u origin main
```

## Environment Variables

Create a `.env.local` file with:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important Notes:**
- `NEXTAUTH_SECRET`: Generate a random secret key (you can use `openssl rand -base64 32` or any random string generator)
- `NEXTAUTH_URL`: For production, change this to your actual domain (e.g., `https://yourdomain.com`)
- Never commit `.env.local` to git (it's already in `.gitignore`)

For automated reminders, see [REMINDERS_SETUP.md](./REMINDERS_SETUP.md) for email and SMS configuration.

## Authentication

The application now includes user authentication with username and password:

1. **Register a new account**: Navigate to `/register` to create your first user account
2. **Login**: Navigate to `/login` to sign in
3. **Protected Routes**: All dashboard pages and API routes require authentication
4. **Session Management**: Sessions are managed via NextAuth.js with JWT tokens

**First Time Setup:**
- After starting the app, go to `/register` to create your first admin account
- You can create additional accounts through the registration page
- All routes are protected except `/login` and `/register`

## Project Structure

```
GearShift/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── api/jobs/          # API routes
│   │   ├── jobs/              # Job pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── JobForm.tsx        # Job creation/edit form
│   │   ├── JobCard.tsx        # Job card component
│   │   └── JobList.tsx        # Job list component
│   └── lib/                   # Utilities
│       ├── db.ts              # Prisma client
│       └── types.ts           # TypeScript types
└── .env.local                 # Environment variables
```


