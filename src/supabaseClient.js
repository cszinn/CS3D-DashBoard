import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Inicializa o cliente Supabase. Os valores acima serão preenchidos
// quando criarmos o arquivo .env com as chaves do seu projeto.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
