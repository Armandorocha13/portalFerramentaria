import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERRO: Variáveis de ambiente do Supabase não configuradas em .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
