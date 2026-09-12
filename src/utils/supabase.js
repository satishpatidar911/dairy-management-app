import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://bxdbzttbfslaouuhkagp.supabase.co';
const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_TRddWQxs5lZ5WOd-PTV9nw_22qNzDZ2';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConnected = async () => {
  try {
    const { data, error } = await supabase.from('farm_profile').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};
