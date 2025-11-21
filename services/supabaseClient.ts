
import { createClient } from '@supabase/supabase-js';

// 更新為正確的 Project URL
const SUPABASE_URL = 'https://qozrcckqztsikaiopbca.supabase.co';

// 使用你提供的 Key
const SUPABASE_KEY = 'DjN9SRxtvrBxLhRzfcPJle3VZGA1pjevUW90HBsuNLXw2pnbzSKy0Mg8MmL9dfpDRHD1kkVUxMzvLEXK6o6Flw==';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 對應資料庫 Table 名稱
export const DB_TABLES = {
  PRODUCTS: 'product', 
  USERS: 'user',
  REPORTS: 'reports' // Assuming a table for reports, or we store in localstorage fallback
};

// Helper to log errors properly
export const logSupabaseError = (action: string, error: any) => {
    console.error(`Supabase ${action} Error:`, JSON.stringify(error, null, 2));
};
