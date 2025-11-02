import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabaseServieceRoleKey = process.env.SUPABASE_SERVIECE_ROLE_KEY
const supabase = createClient(
  supabaseUrl,
  supabaseServieceRoleKey
);

export default supabase;

