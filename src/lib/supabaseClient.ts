import { createBrowserClient } from '@supabase/ssr'

// No Next.js 15/16, DEVEMOS usar createBrowserClient no front-end
// para que ele saiba usar o PKCE Flow (?code=) automaticamente no OAuth.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
