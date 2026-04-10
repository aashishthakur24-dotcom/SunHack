# SunHack DecisionDNA

This project is a Vite + React app backed by Supabase for:

- Authentication with email/password and Google OAuth
- Decisions, canvas nodes, connections, and insights in Postgres
- Optional Cloudinary uploads for files/media

## 1. Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql).
3. Enable Google OAuth in Supabase Auth and add your Google client credentials.
4. Add these redirect URLs in Supabase Auth settings:
	- `http://localhost:5173/dashboard`
	- your production dashboard URL
5. Copy `.env.example` to `.env.local` and fill in the Supabase values.

## 2. Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## 3. Deployment

Add the Supabase and Cloudinary environment values in Vercel Project Settings -> Environment Variables.

Then deploy:

```bash
npx vercel --prod
```

## 4. Notes

- Supabase Auth stores the session in the browser and keeps the app signed in across reloads.
- The SQL schema enables Row Level Security so each user only sees their own records.
- File uploads still go through Cloudinary using unsigned upload presets.

