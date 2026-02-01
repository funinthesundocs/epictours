# Database Migration Scripts

## Setup

1. Add `DATABASE_URL` to your `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gtzpspdtdnkjoblbvzxo.supabase.co:5432/postgres
   ```
   
   Get your password from: Supabase → Settings → Database → Connection String

2. Run migrations:
   ```powershell
   npm run db:migrate database/38_drop_redundant_columns.sql
   ```

## Available Scripts

- `npm run db:migrate <file>` - Run a specific SQL file
- `npm run db:verify` - Run verification queries
