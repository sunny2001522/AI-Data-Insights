
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppById, getLatestReport, saveReport } from '../services/storageService';
import { AppConfig, ReportData, AnalysisResult, HealthStatus, MergedInsight } from '../types';
import { fetchMixpanelStats } from '../services/mixpanelService'; // Now using real service logic
import { analyzeData } from '../services/geminiService';
import { generatePPT } from '../services/pptService';
import { 
  ArrowLeft, Loader2, Send, FileText, 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle2, AlertCircle, Target, ExternalLink, Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppConfig | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [data, setData] = useState<ReportData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [pushing, setPushing] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (!id) return;
    const foundApp = getAppById(id);
    if (!foundApp) {
      navigate('/');
      return;
    }
    setApp(foundApp);
    
    const init = async () => {
      try {
        setLoading(true);
        
        // 1. Try Cache First (24h)
        const cachedAnalysis = await getLatestReport(id);
        
        // Fetch Data (Always fetch fresh data to show "Current Stats" even if analysis is cached)
        setLoadingStep('正在連線 Mixpanel 撈取本週數據...');
        // Fallback to defaults if tokens missing
        const token = foundApp.mixpanelToken || 'mock_token';
        const secret = foundApp.mixpanelSecret || 'mock_secret';
        const reportData = await fetchMixpanelStats(token, secret) as ReportData;
        setData(reportData);

        if (cachedAnalysis) {
            console.log("Hit Cache!");
            setAnalysis(cachedAnalysis);
            setIsCached(true);
        } else {
            // 2. Run Gemini Analysis
            setLoadingStep('AI 正在進行深度歸因分析與 OKR 設定...');
            const geminiResult = await analyzeData(foundApp, reportData);
            setAnalysis(geminiResult);
            await saveReport(id, geminiResult); // Save to cache
        }

      } catch (err: any) {
        console.error("Process Error:", err);
        setError(err.message || '分析過程發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, navigate]);

  const handlePushToChat = async () => {
      setPushing(true);
      // Simulate a push
      setTimeout(() => {
          setPushing(false);
          alert(`✅ 訊息已推送至 Google Chat! \n(這是一個模擬回應，因為後端無法在預覽環境中連接)`);
          if (app?.chatWebhookUrl) {
              window.open(app.chatWebhookUrl, '_blank');
          }
      }, 1500);
  };

  const handleDownloadPPT = async () => {
      if (!app || !data || !analysis) return;
      await generatePPT(app.name, data, analysis);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">{loadingStep}</h3>
        <p className="text-gray-500 mt-2">正在為您處理大數據分析...</p>
      </div>
    );
  }

  if (!data || !analysis || !app) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="bg-white p-2 rounded-full hover:bg-gray-50 border border-gray-200">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
                {isCached && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">已讀取快取 (24h)</span>}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar size={12}/> 數據週期: {data.metrics.weekStart} ~ Today
            </p>
          </div>
          <HealthBadge status={analysis.health_status} />
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadPPT} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50">
            <FileText size={18} /> 下載簡報
          </button>
          <button onClick={handlePushToChat} disabled={pushing} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
             {pushing ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />} 推送 Chat
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* OKR Section (High Priority) */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Target size={16} className="text-green-400"/> Next Week Objectives (OKR)
                </h3>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <div className="text-gray-400 text-xs mb-1">目標下載</div>
                        <div className="text-2xl font-mono font-bold">{analysis.next_week_target.downloads.toLocaleString()}</div>
                        <div className="text-xs text-green-400 mt-1">預期 +5%</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs mb-1">目標活躍</div>
                        <div className="text-2xl font-mono font-bold">{analysis.next_week_target.active_users.toLocaleString()}</div>
                        <div className="text-xs text-green-400 mt-1">預期 +2%</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs mb-1">目標留存</div>
                        <div className="text-2xl font-mono font-bold">{analysis.next_week_target.retention_7d}%</div>
                        <div className="text-xs text-gray-400 mt-1">持平</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600"/> 日趨勢分析 (Daily Trends)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" orientation="left" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            />
                            <Line yAxisId="left" type="monotone" dataKey="downloads" stroke="#3B82F6" strokeWidth={3} dot={{r: 3}} name="下載" />
                            <Line yAxisId="right" type="monotone" dataKey="activeUsers" stroke="#10B981" strokeWidth={3} dot={{r: 3}} name="活躍" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Merged Insights & Actions */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 ml-1">深度歸因與建議行動</h3>
                {(analysis.merged_insights || []).map((item, idx) => (
                    <InsightActionCard key={idx} item={item} />
                ))}
            </div>

        </div>

        {/* Right: Summary & Metrics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
             {/* Current Metrics */}
             <div className="grid grid-cols-1 gap-4">
                <MetricCard label="本週下載" value={data.metrics.downloads.toLocaleString()} wow={data.wow.downloads} />
                <MetricCard label="本週活躍 (WAU)" value={data.metrics.activeUsers.toLocaleString()} wow={data.wow.activeUsers} />
                <MetricCard label="7日留存率" value={`${data.metrics.retention7d}%`} wow={data.wow.retention} isPercent />
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Gemini 總評</h3>
                <p className="text-gray-600 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* External Links */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 mb-3">快速連結</h3>
                <div className="space-y-2">
                    {app.appStoreLink ? (
                        <a href={app.appStoreLink} target="_blank" className="flex items-center gap-2 text-blue-600 text-sm hover:underline">
                            <ExternalLink size={14}/> App Store 頁面
                        </a>
                    ) : <span className="text-gray-400 text-sm">未設定 App Store</span>}
                    
                    {app.playStoreLink ? (
                        <a href={app.playStoreLink} target="_blank" className="flex items-center gap-2 text-green-600 text-sm hover:underline">
                            <ExternalLink size={14}/> Google Play 頁面
                        </a>
                    ) : <span className="text-gray-400 text-sm">未設定 Google Play</span>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const InsightActionCard: React.FC<{ item: MergedInsight }> = ({ item }) => {
    // Blue-scale logic: Low = Light, High = Dark
    const bgClass = item.impact_level === '高' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200';
    const impactColor = item.impact_level === '高' ? 'bg-blue-600 text-white' : item.impact_level === '中' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-700';

    return (
        <div className={`p-5 rounded-xl border shadow-sm ${bgClass}`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${impactColor}`}>
                    影響: {item.impact_level}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">觀察現象 (歸因)</div>
                    <p className="text-gray-700 text-sm leading-relaxed">{item.observation}</p>
                </div>
                 <div className="relative pl-6 md:border-l border-gray-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-full md:hidden"></div>
                    <div className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">建議行動</div>
                    <p className="text-gray-900 font-medium text-sm">{item.action}</p>
                </div>
            </div>
            
            {item.evidence && (
                 <div className="mt-4 pt-3 border-t border-gray-200/50 text-xs text-gray-400 flex items-center gap-1">
                    🔍 證據: {item.evidence}
                 </div>
            )}
        </div>
    );
};

const MetricCard: React.FC<{ label: string, value: string, wow: number, isPercent?: boolean }> = ({ label, value, wow }) => {
    const isPositive = wow >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
            </div>
            <div className={`flex items-center gap-1 ${color} bg-gray-50 px-2 py-1 rounded-lg`}>
                <Icon size={16} />
                <span className="font-bold text-sm">{Math.abs(wow)}%</span>
            </div>
        </div>
    );
};

const HealthBadge: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const map = {
        [HealthStatus.NORMAL]: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
        [HealthStatus.WARNING]: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
        [HealthStatus.CRITICAL]: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const conf = map[status] || map[HealthStatus.NORMAL];
    const Icon = conf.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm ${conf.color}`}>
            <Icon size={16} /> {status}
        </div>
    );
};

export default ReportView;
