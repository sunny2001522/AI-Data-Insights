export enum HealthStatus {
  NORMAL = '正常',
  WARNING = '需關注',
  CRITICAL = '異常',
}

export interface AppConfig {
  id: string;
  name: string;
  mixpanelToken: string;
  mixpanelSecret: string;
  chatWebhookUrl: string;
  competitors: string[];
  keywords: string[];
}

export interface WeeklyMetric {
  weekStart: string;
  downloads: number;
  activeUsers: number;
  retention7d: number;
}

export interface ReportData {
  metrics: WeeklyMetric;
  wow: {
    downloads: number;
    activeUsers: number;
    retention: number;
  };
  productUpdates: string[];
  reviewsSummary: string;
  socialMentions: string;
}

export interface Insight {
  title: string;
  description: string;
  evidence: string;
  impact_level: '高' | '中' | '低';
  links: string[];
}

export interface ActionItem {
  action: string;
  priority: '高' | '中' | '低';
  expected_impact: string;
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
  health_status: HealthStatus;
  summary: string;
  insights: Insight[];
  actions: ActionItem[];
  risks: string[];
  next_week_target: NextWeekTarget;
  slides: SlideContent[];
}