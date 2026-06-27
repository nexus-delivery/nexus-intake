This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Setup

The application uses [Supabase](https://supabase.com) for its database. Schema changes are managed via migrations stored in `supabase/migrations/`.

### Prerequisites

- A Supabase project. Create one at [supabase.com](https://supabase.com).
- The Supabase CLI (included as a dev dependency — no global install required).

### Applying Migrations

1. **Link your Supabase project** (one-time setup):

   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

   Replace `<your-project-ref>` with the reference ID from your Supabase project settings (e.g. `abcdefghijklmnop`).

2. **Apply all pending migrations**:

   ```bash
   npx supabase db push
   ```

   This will create the `draft_jobs` table (and any future migrations) in your Supabase database.

### What the migrations create

| Migration | Creates |
|---|---|
| `20260627_create_draft_jobs_table.sql` | `draft_jobs` table, `idx_draft_jobs_company_id` index, `draft_jobs_updated_at` trigger |

#### `draft_jobs` table schema

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key, auto-generated |
| `company_id` | `UUID` | Required — enables multi-tenancy |
| `created_by_user_id` | `UUID` | Optional — set when auth is implemented |
| `primary_document_id` | `UUID` | FK → `uploaded_documents(id)` |
| `status` | `TEXT` | `'document_uploaded'` or `'job_created'` |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated by trigger |

> **Note:** Row Level Security (RLS) is intentionally disabled in this migration. RLS policies are included as comments for when authentication is fully implemented.

### Further reading

- [Supabase CLI documentation](https://supabase.com/docs/reference/cli/introduction)
- [Supabase migrations guide](https://supabase.com/docs/guides/database/migrations)
