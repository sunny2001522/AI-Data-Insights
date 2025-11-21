
export enum HealthStatus {
  NORMAL = '正常',
  WARNING = '需關注',
  CRITICAL = '異常',
}

export interface AppConfig {
  id: string;
  name: string;
  // Mixpanel
  mixpanelToken: string;
  mixpanelSecret: string;
  // GA
  gaToken?: string;
  gaSecret?: string;
  // Store Links
  appStoreLink?: string;
  playStoreLink?: string;
  // Notifications
  chatWebhookUrl: string;
  // Config
  competitors: string[];
  keywords: string[];
  isMonitored?: boolean; // To distinguish "Company Products" vs "My Monitored Products"
}

export interface DailyStat {
  date: string;
  downloads: number;
  activeUsers: number;
}

export interface WeeklyMetric {
  weekStart: string;
  downloads: number;
  activeUsers: number;
  retention7d: number;
}

export interface ReportData {
  metrics: WeeklyMetric;
  dailyStats: DailyStat[]; // New for charts
  wow: {
    downloads: number;
    activeUsers: number;
    retention: number;
  };
  productUpdates: string[];
  reviewsSummary: string;
  socialMentions: string;
}

// Merged Insight + Action structure
export interface MergedInsight {
  title: string;
  observation: string; // "歸因分析" (e.g., 連假造成活躍下降)
  action: string;      // "建議行動" (e.g., 宜趁連假末尾開始曝光)
  evidence: string;
  impact_level: '高' | '中' | '低';
}

export interface NextWeekTarget {
  downloads: number;
  active_users: number;
  retention_7d: number;
}

export interface SlideContent {
  title: string;
  bullets: string[];
  speaker_notes: string;
}

export interface AnalysisResult {
  generated_at?: number; // Timestamp for caching
  health_status: HealthStatus;
  summary: string;
  merged_insights: MergedInsight[]; // New merged structure
  risks: string[];
  next_week_target: NextWeekTarget;
  slides: SlideContent[];
}
