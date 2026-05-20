import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Supabase 프로젝트 URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON; // Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;