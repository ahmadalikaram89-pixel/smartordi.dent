import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env variables fehlen. Bitte .env Datei mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY anlegen.'
  )
}

// Placeholder-Werte verhindern einen Absturz von createClient(), falls die
// echten Werte fehlen (z.B. Deployment ohne konfigurierte Env-Variablen).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
