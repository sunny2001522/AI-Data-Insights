
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApps } from '../services/storageService';
import { AppConfig } from '../types';
import { Plus, Activity, BarChart3, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        const data = await getApps();
        setApps(data);
        setLoading(false);
    };
    load();
  }, []);

  if (loading) {
      return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      );
  }

  if (apps.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 max-w-lg">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">歡迎使用 App 自動化分析系統</h2>
          <p className="text-gray-500 mb-8">目前尚未設定任何 App。請新增您的第一個產品以開始自動化數據蒐集與 AI 分析。</p>
          <Link
            to="/add"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            <Plus size={20} />
            新增 App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">總覽所有監控中的應用程式</p>
        </div>
        <Link
          to="/add"
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          新增 App
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
};

const AppCard: React.FC<{ app: AppConfig }> = ({ app }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
            {app.name.charAt(0).toUpperCase()}
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Monitoring
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-1">{app.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-6">
          Mixpanel ID: {app.mixpanelToken ? '••••' + app.mixpanelToken.slice(-4) : 'Not Set'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
           <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">上次分析</div>
              <div className="font-medium text-gray-800">--</div>
           </div>
           <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">狀態</div>
              <div className="font-medium text-gray-800">待命</div>
           </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
        <Link
          to={`/report/${app.id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <BarChart3 size={16} />
          生成週報
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
