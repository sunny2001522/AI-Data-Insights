
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, PlugZap, Loader2, CheckCircle2 } from 'lucide-react';
import { saveApp } from '../services/storageService';
import { fetchMixpanelStats } from '../services/mixpanelService';
import { AppConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

const AppSetup: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const [formData, setFormData] = useState<Partial<AppConfig>>({
    name: '',
    mixpanelToken: '',
    mixpanelSecret: '',
    chatWebhookUrl: '',
    competitors: [],
    keywords: ['AI Meeting', 'AI Note'],
  });

  const handleTestConnection = async () => {
    if (!formData.mixpanelToken || !formData.mixpanelSecret) {
        alert('請先填寫 Mixpanel Token 和 API Secret');
        return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    try {
        // 嘗試撈取真實數據
        const stats = await fetchMixpanelStats(formData.mixpanelToken, formData.mixpanelSecret);
        setTestResult(stats);
    } catch (e: any) {
        alert(`連線失敗: ${e.message}\n(如果是 CORS 錯誤，請安裝 Allow CORS 套件或忽略，系統仍可儲存)`);
    } finally {
        setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSaving(true);
    try {
        const newApp: AppConfig = {
            id: uuidv4(),
            name: formData.name!,
            mixpanelToken: formData.mixpanelToken || '',
            mixpanelSecret: formData.mixpanelSecret || '',
            chatWebhookUrl: formData.chatWebhookUrl || '',
            competitors: formData.competitors || [],
            keywords: formData.keywords || [],
        };

        await saveApp(newApp);
        alert('✅ App 新增成功！資料已同步至 Supabase。');
        navigate('/');
    } catch (e: any) {
        alert(`儲存失敗: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">新增 App 監控</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App 名稱</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. AI Note Taker"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex justify-between items-center">
                Mixpanel 設定
                {testResult && (
                    <span className="text-green-600 text-sm flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle2 size={14} /> 連線成功: WAU {testResult.metrics.activeUsers}
                    </span>
                )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Token</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="Mixpanel Token"
                  value={formData.mixpanelToken}
                  onChange={e => setFormData({...formData, mixpanelToken: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="Mixpanel API Secret"
                  value={formData.mixpanelSecret}
                  onChange={e => setFormData({...formData, mixpanelSecret: e.target.value})}
                />
              </div>
            </div>
            <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
                {isTesting ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
                {isTesting ? '連線測試中...' : '測試 Mixpanel 連線並撈取本週數據'}
            </button>
          </div>

          {/* Notification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">通知設定</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Chat Webhook URL</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="https://chat.googleapis.com/v1/spaces/..."
                value={formData.chatWebhookUrl}
                onChange={e => setFormData({...formData, chatWebhookUrl: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">我們會將每週生成的 PPT 與洞見推送到此群組。</p>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? '儲存中...' : '儲存並啟用監控'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppSetup;
