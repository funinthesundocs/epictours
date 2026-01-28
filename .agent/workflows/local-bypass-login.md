---
description: Implement a login screen that is bypassed on localhost but active on production associated with a Dev Login button.
---

# Local Login Bypass Implementation

This workflow outlines how to implement a system where the login screen is bypassed (or easily skippable) on `localhost`, while remaining secure in production.

## Strategy
Instead of completely disabling auth (which breaks Row Level Security), we implement a **"Dev Auto-Login"** button that only appears in development.

## Implementation Steps

### 1. Update Middleware
Ensure `middleware.ts` handles the environment check if you want purely automatic bypass, but the "Button" approach is preferred for RLS context.

### 2. Add Dev Login Button (`features/auth/login-page.tsx`)
Add a button that only renders when `process.env.NODE_ENV === 'development'`.

```tsx
// features/auth/login-page.tsx
export default function LoginPage() {
  const isDev = process.env.NODE_ENV === 'development';

  const handleDevLogin = async () => {
      // Logic to sign in as a test user automatically
      // e.g. await supabase.auth.signInWithPassword({ ... })
  };

  return (
    <div>
      <LoginForm />
      
      {isDev && (
        <div className="mt-4 p-4 border-2 border-dashed border-yellow-500 rounded bg-yellow-500/10">
            <p className="text-yellow-500 text-sm mb-2 font-bold uppercase">Development Mode</p>
            <button 
                onClick={handleDevLogin} 
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
            >
               [DEV] Auto-Login as Admin
            </button>
        </div>
      )}
    </div>
  )
}
```

### 3. Verify Environment
Ensure your `.env.local` or system environment has `NODE_ENV=development` (default for `next dev`).
