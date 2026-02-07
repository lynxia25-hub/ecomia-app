/**
 * Test: Supabase client initialization
 */
import { createClient as createBrowserClient } from '@/lib/supabase/client'

describe('Supabase Client', () => {
  it('should create a browser client instance', () => {
    // Only test this if Supabase env vars are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const client = createBrowserClient()
      expect(client).toBeDefined()
      // Verify basic client structure
      expect(client.auth).toBeDefined()
    }
  })
})
