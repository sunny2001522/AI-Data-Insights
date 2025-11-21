
import { AppConfig, AnalysisResult } from '../types';
import { supabase, DB_TABLES, logSupabaseError } from './supabaseClient';

const STORAGE_KEY_APPS = 'app_analytics_products';
const STORAGE_KEY_REPORTS = 'app_analytics_reports';

// --- Apps Management ---

export const getApps = async (): Promise<AppConfig[]> => {
  try {
    // 1. Try Supabase
    const { data, error } = await supabase.from(DB_TABLES.PRODUCTS).select('*');

    if (error) {
      logSupabaseError('fetch', error);
      throw error;
    }

    // Map Supabase schema to AppConfig
    const mappedApps: AppConfig[] = data.map((item: any) => {
        // Parse settings from JSONB or fallback
        const settings = item.settings || {};
        
        return {
            id: item.uuid || item.id,
            name: item.Name || item.name,
            mixpanelToken: item.mixpanel_token || settings.mixpanelToken || '',
            mixpanelSecret: item.mixpanel_secret || settings.mixpanelSecret || '',
            gaToken: settings.gaToken || '',
            gaSecret: settings.gaSecret || '',
            appStoreLink: settings.appStoreLink || '',
            playStoreLink: settings.playStoreLink || '',
            chatWebhookUrl: item.chat_webhook_url || settings.chatWebhookUrl || '',
            competitors: settings.competitors || [],
            keywords: settings.keywords || [],
            isMonitored: item.is_monitored ?? true // Default to true for existing
        };
    });

    // Update Local Cache
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(mappedApps));
    return mappedApps;

  } catch (e) {
    console.warn("Using LocalStorage Fallback for Apps");
    const localData = localStorage.getItem(STORAGE_KEY_APPS);
    return localData ? JSON.parse(localData) : [];
  }
};

export const saveApp = async (app: AppConfig): Promise<void> => {
  // 1. Update Local
  const apps = getLocalApps();
  const existingIndex = apps.findIndex((a) => a.id === app.id);
  if (existingIndex >= 0) apps[existingIndex] = app;
  else apps.push(app);
  localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));

  // 2. Update Supabase
  const settings = {
      mixpanelToken: app.mixpanelToken, // Store backup in settings
      mixpanelSecret: app.mixpanelSecret,
      gaToken: app.gaToken,
      gaSecret: app.gaSecret,
      appStoreLink: app.appStoreLink,
      playStoreLink: app.playStoreLink,
      chatWebhookUrl: app.chatWebhookUrl,
      competitors: app.competitors,
      keywords: app.keywords
  };

  const payload = {
    uuid: app.id,
    Name: app.name,
    // Map core fields if they exist in your schema
    mixpanel_token: app.mixpanelToken,
    mixpanel_secret: app.mixpanelSecret,
    chat_webhook_url: app.chatWebhookUrl,
    // Store everything else in settings JSONB
    settings: settings,
    is_monitored: app.isMonitored
  };

  const { error } = await supabase
    .from(DB_TABLES.PRODUCTS)
    .upsert(payload, { onConflict: 'uuid' });

  if (error) {
    logSupabaseError('save', error);
    // Don't throw, just log. We want the UI to continue working via LocalStorage.
    console.warn("Supabase save failed, data persisted locally only.");
  }
};

export const getLocalApps = (): AppConfig[] => {
    const data = localStorage.getItem(STORAGE_KEY_APPS);
    return data ? JSON.parse(data) : [];
}

export const getAppById = (id: string): AppConfig | undefined => {
  return getLocalApps().find((a) => a.id === id);
};

// --- Reports Caching (24 Hour Logic) ---

export const getLatestReport = async (appId: string): Promise<AnalysisResult | null> => {
    const key = `${STORAGE_KEY_REPORTS}_${appId}`;
    const cachedStr = localStorage.getItem(key);
    
    if (cachedStr) {
        const cached = JSON.parse(cachedStr) as AnalysisResult;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Check validity (generated within 24 hours)
        if (cached.generated_at && (now - cached.generated_at < oneDay)) {
            console.log("Using cached report for", appId);
            return cached;
        }
    }
    return null;
};

export const saveReport = async (appId: string, result: AnalysisResult): Promise<void> => {
    // Add timestamp
    result.generated_at = Date.now();
    
    // Local Save
    const key = `${STORAGE_KEY_REPORTS}_${appId}`;
    localStorage.setItem(key, JSON.stringify(result));
    
    // Supabase Save (Optional/Bonus - usually requires a Reports table)
    // For MVP, we rely on LocalStorage for report caching to avoid schema issues.
};
