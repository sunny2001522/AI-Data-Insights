
import { AppConfig } from '../types';
import { supabase, DB_TABLES } from './supabaseClient';

// 為了保持前端響應速度，我們使用本地緩存 + 非同步同步到 Supabase
const STORAGE_KEY = 'app_analytics_products';

export const getApps = async (): Promise<AppConfig[]> => {
  // 1. 先嘗試從 Supabase 撈取
  const { data, error } = await supabase
    .from(DB_TABLES.PRODUCTS)
    .select('*');

  if (error) {
    console.error('Supabase fetch error:', error);
    // Fallback to local storage if offline
    const localData = localStorage.getItem(STORAGE_KEY);
    return localData ? JSON.parse(localData) : [];
  }

  // 假設 Supabase 中的結構需要轉換 (因為你提到的欄位是 Name, Type 等)
  // 這裡我們假設你有一個 JSONB 欄位叫 'settings' 或者是直接存平鋪的欄位
  // 為了 MVP，我們將資料轉換回 AppConfig 格式
  const mappedApps: AppConfig[] = data.map((item: any) => ({
    id: item.uuid || item.id,
    name: item.Name || item.name,
    // 假設這些敏感資訊存在 settings 欄位或是直接欄位中，這裡做個相容處理
    mixpanelToken: item.mixpanel_token || item.settings?.mixpanelToken || '',
    mixpanelSecret: item.mixpanel_secret || item.settings?.mixpanelSecret || '',
    chatWebhookUrl: item.chat_webhook_url || item.settings?.chatWebhookUrl || '',
    competitors: item.competitors || [],
    keywords: item.keywords || []
  }));

  // Update local cache
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedApps));
  return mappedApps;
};

export const getLocalApps = (): AppConfig[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export const saveApp = async (app: AppConfig): Promise<void> => {
  // 1. Update Local
  const apps = getLocalApps();
  const existingIndex = apps.findIndex((a) => a.id === app.id);
  if (existingIndex >= 0) apps[existingIndex] = app;
  else apps.push(app);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

  // 2. Update Supabase
  // 根據你的 Schema: product (Name, Type, ...)
  // 我們將 AppConfig 的資料對應進去
  const payload = {
    uuid: app.id, // 假設你的 PK 是 uuid
    Name: app.name,
    // 這裡假設你有開對應的欄位，如果沒有，建議在 Supabase 新增一個 jsonb 欄位叫 'config' 或 'settings'
    mixpanel_token: app.mixpanelToken,
    mixpanel_secret: app.mixpanelSecret, 
    chat_webhook_url: app.chatWebhookUrl,
    // 或者存成 JSON
    settings: {
        competitors: app.competitors,
        keywords: app.keywords
    }
  };

  const { error } = await supabase
    .from(DB_TABLES.PRODUCTS)
    .upsert(payload, { onConflict: 'uuid' });

  if (error) {
    console.error('Supabase save error:', error);
    throw new Error('儲存至雲端資料庫失敗');
  }
};

export const deleteApp = async (id: string): Promise<void> => {
  // Local
  const apps = getLocalApps().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

  // Supabase
  const { error } = await supabase
    .from(DB_TABLES.PRODUCTS)
    .delete()
    .eq('uuid', id);
    
  if (error) console.error('Supabase delete error:', error);
};

export const getAppById = (id: string): AppConfig | undefined => {
  return getLocalApps().find((a) => a.id === id);
};
