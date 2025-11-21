
import React, { useState, useEffect } from 'react';
import { X, Save, PlugZap, Loader2, CheckCircle2, LayoutGrid, Database, Store } from 'lucide-react';
import { AppConfig } from '../types';
import { saveApp } from '../services/storageService';
import { fetchMixpanelStats } from '../services/mixpanelService';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    existingApp?: AppConfig;
    onSaved: () => void;
}

const AppConfigModal: React.FC<Props> = ({ isOpen, onClose, existingApp, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'data' | 'store'>('basic');

    const [formData, setFormData] = useState<Partial<AppConfig>>({
        name: '',
        mixpanelToken: '',
        mixpanelSecret: '',
        gaToken: '',
        gaSecret: '',
        appStoreLink: '',
        playStoreLink: '',
        chatWebhookUrl: '',
        competitors: [],
        keywords: [],
        isMonitored: true
    });

    useEffect(() => {
        if (existingApp) {
            setFormData(existingApp);
        } else {
            // Reset for new app
            setFormData({ isMonitored: true });
        }
        setTestResult(null);
    }, [existingApp, isOpen]);

    if (!isOpen) return null;

    const handleTestConnection = async () => {
        if (!formData.mixpanelToken || !formData.mixpanelSecret) {
            alert("請先填寫 Mixpanel Token 與 Secret");
            return;
        }
        setTesting(true);
        try {
            const res = await fetchMixpanelStats(formData.mixpanelToken, formData.mixpanelSecret);
            setTestResult(res);
        } catch (e) {
            alert("連線失敗 (請檢查 Token)");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert("請輸入 App 名稱");
            return;
        }
        setLoading(true);
        try {
            const appToSave: AppConfig = {
                id: existingApp?.id || uuidv4(),
                name: formData.name,
                mixpanelToken: formData.mixpanelToken || '',
                mixpanelSecret: formData.mixpanelSecret || '',
                gaToken: formData.gaToken || '',
                gaSecret: formData.gaSecret || '',
                appStoreLink: formData.appStoreLink || '',
                playStoreLink: formData.playStoreLink || '',
                chatWebhookUrl: formData.chatWebhookUrl || '',
                competitors: formData.competitors || [],
                keywords: formData.keywords || [],
                isMonitored: true
            };
            
            await saveApp(appToSave);
            onSaved();
            onClose();
        } catch (e: any) {
            alert("儲存失敗: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {existingApp ? `編輯 ${existingApp.name}` : '新增監控產品'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <LayoutGrid size={16} /> 基本資訊
                    </button>
                    <button 
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Database size={16} /> 數據來源 (Mixpanel/GA)
                    </button>
                    <button 
                        onClick={() => setActiveTab('store')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'store' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Store size={16} /> 商店連結
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App 名稱 *</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. AI Note Taker"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Chat Webhook URL</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    value={formData.chatWebhookUrl}
                                    onChange={(e) => setFormData({...formData, chatWebhookUrl: e.target.value})}
                                    placeholder="https://chat.googleapis.com/..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* Mixpanel */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Mixpanel 設定
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input 
                                        className="p-2 border rounded-lg text-sm"
                                        placeholder="Project Token"
                                        value={formData.mixpanelToken}
                                        onChange={(e) => setFormData({...formData, mixpanelToken: e.target.value})}
                                    />
                                    <input 
                                        className="p-2 border rounded-lg text-sm"
                                        type="password"
                                        placeholder="API Secret"
                                        value={formData.mixpanelSecret}
                                        onChange={(e) => setFormData({...formData, mixpanelSecret: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <button 
                                        onClick={handleTestConnection}
                                        disabled={testing}
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        {testing ? <Loader2 size={14} className="animate-spin"/> : <PlugZap size={14}/>}
                                        測試連線並撈取本週數據
                                    </button>
                                    {testResult && (
                                        <span className="text-green-600 text-xs font-bold flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                                            <CheckCircle2 size={12}/> 連線成功! 本週活躍: {testResult.metrics.activeUsers.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* GA (Optional) */}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 opacity-80">
                                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Google Analytics (GA4)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input 
                                        className="p-2 border rounded-lg text-sm"
                                        placeholder="Measurement ID (G-XXXX)"
                                        value={formData.gaToken}
                                        onChange={(e) => setFormData({...formData, gaToken: e.target.value})}
                                    />
                                    <input 
                                        className="p-2 border rounded-lg text-sm"
                                        type="password"
                                        placeholder="API Secret"
                                        value={formData.gaSecret}
                                        onChange={(e) => setFormData({...formData, gaSecret: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'store' && (
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App Store 連結</label>
                                <input 
                                    className="w-full p-2 border rounded-lg text-sm text-blue-600 underline"
                                    placeholder="https://apps.apple.com/tw/app/..."
                                    value={formData.appStoreLink}
                                    onChange={(e) => setFormData({...formData, appStoreLink: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Play 連結</label>
                                <input 
                                    className="w-full p-2 border rounded-lg text-sm text-green-600 underline"
                                    placeholder="https://play.google.com/store/apps/details?id=..."
                                    value={formData.playStoreLink}
                                    onChange={(e) => setFormData({...formData, playStoreLink: e.target.value})}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                💡 系統將自動爬取商店更新紀錄與評論，供 AI 進行深度歸因分析。
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        取消
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                        儲存設定
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppConfigModal;
