
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppById } from '../services/storageService';
import { AppConfig, ReportData, AnalysisResult, HealthStatus } from '../types';
import { fetchAppData } from '../services/mockDataService';
import { analyzeData } from '../services/geminiService';
import { generatePPT } from '../services/pptService';
import { 
  ArrowLeft, 
  Loader2, 
  Download, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText
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
  const [generatingPPT, setGeneratingPPT] = useState(false);

  useEffect(() => {
    if (!id) return;
    const foundApp = getAppById(id);
    if (!foundApp) {
      navigate('/');
      return;
    }
    setApp(foundApp);
    
    const runAnalysis = async () => {
      try {
        setLoading(true);
        
        setLoadingStep('正在蒐集 Mixpanel 數據...');
        // TODO: 這裡目前還是用 mockDataService，未來可以換成 mixpanelService 的邏輯
        // 但為了保持 ReportView 的穩定，我們暫時不改這裡的 Fetch 邏輯
        const reportData = await fetchAppData(id);
        setData(reportData);

        setLoadingStep('Gemini 2.0 Flash 正在進行歸因分析與 PPT 結構生成...');
        const geminiResult = await analyzeData(foundApp.name, reportData);
        setAnalysis(geminiResult);

      } catch (err: any) {
        console.error("Analysis Error Detail:", err);
        setError(err.message || '分析過程發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleDownloadPPT = async () => {
    if (!app || !data || !analysis) return;
    
    try {
      setGeneratingPPT(true);
      await generatePPT(app.name, data, analysis);
    } catch (e) {
      console.error(e);
      alert('生成 PPT 失敗，請稍後再試');
    } finally {
      setGeneratingPPT(false);
    }
  };

  const handlePushToChat = async () => {
    if (!app?.chatWebhookUrl) {
        alert("請先在設定頁面配置 Google Chat Webhook URL");
        return;
    }
    setPushing(true);

    try {
        const payload = {
            text: `📊 *${app.name} 週度數據報告測試*\n` +
                  `時間: ${new Date().toLocaleString()}\n` +
                  `------------------\n` +
                  `下載: ${data?.metrics.downloads.toLocaleString()} (${data?.wow.downloads}%)\n` +
                  `活躍: ${data?.metrics.activeUsers.toLocaleString()} (${data?.wow.activeUsers}%)\n` +
                  `留存: ${data?.metrics.retention7d}% (${data?.wow.retention}%)\n` +
                  `\n` +
                  `🤖 *Gemini 洞察:* ${analysis?.summary}\n` + 
                  `(此為測試訊息，PPT 檔案需下載後手動上傳)`
        };

        // 改為呼叫後端 Proxy
        const res = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                webhookUrl: app.chatWebhookUrl,
                message: payload
            })
        });

        if (!res.ok) {
            throw new Error(`Server error! status: ${res.status}`);
        }
        
        alert(`✅ 成功推送訊息至 Google Chat!`);

    } catch (e: any) {
        console.error("Push Failed", e);
        alert(`⚠️ 推送失敗: ${e.message}\n請確認 'node server.js' 是否正在執行，並且 Port 為 3001。`);
    } finally {
        setPushing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">{loadingStep}</h3>
        <p className="text-gray-500 mt-2">這通常需要 5-10 秒鐘...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-screen">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">分析失敗</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="text-red-700 underline">返回首頁</button>
        </div>
      </div>
    );
  }

  if (!data || !analysis || !app) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="bg-white p-2 rounded-full hover:bg-gray-50 border border-gray-200">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{app.name} 週度分析報告</h1>
            <p className="text-sm text-gray-500">生成時間: {new Date().toLocaleString()}</p>
          </div>
          <HealthBadge status={analysis.health_status} />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPPT}
            disabled={generatingPPT}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {generatingPPT ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {generatingPPT ? '生成中...' : '下載 Google 簡報 (.pptx)'}
          </button>
          <button 
            onClick={handlePushToChat}
            disabled={pushing}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {pushing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {pushing ? '傳送中...' : '推送測試訊息'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard 
                    label="總下載數" 
                    value={data.metrics.downloads.toLocaleString()} 
                    wow={data.wow.downloads} 
                />
                <MetricCard 
                    label="活躍用戶 (WAU)" 
                    value={data.metrics.activeUsers.toLocaleString()} 
                    wow={data.wow.activeUsers} 
                />
                <MetricCard 
                    label="七日回訪率" 
                    value={`${data.metrics.retention7d}%`} 
                    wow={data.wow.retention} 
                    suffix="%"
                />
            </div>

            {/* Overview Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Gemini 總評</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{analysis.summary}</p>
            </div>

            {/* Detailed Insights */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">深度歸因分析</h3>
                <div className="space-y-4">
                    {(analysis.insights || []).map((insight, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{insight.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    insight.impact_level === '高' ? 'bg-red-100 text-red-700' : 
                                    insight.impact_level === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    影響: {insight.impact_level}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                            {insight.evidence && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>🔍 證據: {insight.evidence}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!analysis.insights || analysis.insights.length === 0) && (
                        <p className="text-gray-400 text-sm italic">暫無詳細洞見。</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Actions & Forecast */}
        <div className="space-y-6">
            {/* Action Items */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">建議行動 (Top Actions)</h3>
                <div className="space-y-3">
                    {(analysis.actions || []).map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <div className={`mt-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs text-white font-bold ${
                                action.priority === '高' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                                {idx + 1}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{action.action}</p>
                                <p className="text-xs text-gray-500 mt-1">預期: {action.expected_impact}</p>
                            </div>
                        </div>
                    ))}
                    {(!analysis.actions || analysis.actions.length === 0) && (
                        <p className="text-gray-400 text-sm italic">暫無建議行動。</p>
                    )}
                </div>
            </div>

            {/* Next Week Target */}
             <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    下週目標預測
                </h3>
                {analysis.next_week_target ? (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                          <span className="text-gray-400 text-sm">目標下載</span>
                          <span className="font-mono text-xl font-bold">{analysis.next_week_target.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                          <span className="text-gray-400 text-sm">目標活躍</span>
                          <span className="font-mono text-xl font-bold">{analysis.next_week_target.active_users.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">留存率</span>
                          <span className="font-mono text-xl font-bold text-green-400">{analysis.next_week_target.retention_7d}%</span>
                      </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">無預測數據。</p>
                )}
            </div>

             {/* Risks */}
             {analysis.risks && analysis.risks.length > 0 && (
                 <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
                     <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                        <AlertCircle size={16} />
                        潛在風險
                     </h3>
                     <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                        {analysis.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                        ))}
                     </ul>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string, wow: number, suffix?: string }> = ({ label, value, wow, suffix }) => {
    const isPositive = wow >= 0;
    const isNeutral = wow > -5 && wow < 5;
    const colorClass = isNeutral ? 'text-gray-500' : isPositive ? 'text-green-500' : 'text-red-500';
    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">{value}</h4>
            <div className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
                <Icon size={14} />
                <span>{Math.abs(wow)}% WoW</span>
            </div>
        </div>
    );
}

const HealthBadge: React.FC<{ status: HealthStatus }> = ({ status }) => {
    let color = '';
    let icon = null;

    switch(status) {
        case HealthStatus.NORMAL:
            color = 'bg-green-100 text-green-800 border-green-200';
            icon = <CheckCircle2 size={16} />;
            break;
        case HealthStatus.WARNING:
            color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            icon = <AlertCircle size={16} />;
            break;
        case HealthStatus.CRITICAL:
            color = 'bg-red-100 text-red-800 border-red-200';
            icon = <AlertTriangle size={16} />;
            break;
        default:
            color = 'bg-gray-100 text-gray-800 border-gray-200';
            icon = <Minus size={16} />;
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${color} font-semibold text-sm`}>
            {icon}
            {status || "未知"}
        </div>
    );
}

export default ReportView;
