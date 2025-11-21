
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApps, saveApp } from '../services/storageService';
import { AppConfig } from '../types';
import { Plus, Activity, BarChart3, Loader2, Building2, User, Settings2, StopCircle } from 'lucide-react';
import AppConfigModal from '../components/AppConfigModal';

// Mock Company Products (Available to add)
const MOCK_COMPANY_PRODUCTS: AppConfig[] = [
    { id: 'cp_1', name: 'Company App A', mixpanelToken: '', mixpanelSecret: '', chatWebhookUrl: '', competitors: [], keywords: [], isMonitored: false },
    { id: 'cp_2', name: 'Company App B', mixpanelToken: '', mixpanelSecret: '', chatWebhookUrl: '', competitors: [], keywords: [], isMonitored: false },
];

const Dashboard: React.FC = () => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppConfig | undefined>(undefined);

  const loadApps = async () => {
    const data = await getApps();
    setApps(data);
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleEditApp = (app: AppConfig) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedApp(undefined);
    setModalOpen(true);
  };

  const handleAddToMyProducts = async (app: AppConfig) => {
      // Clone and set monitored
      const newApp = { ...app, isMonitored: true };
      await saveApp(newApp);
      loadApps(); // refresh
  };

  const handleStopMonitoring = async (app: AppConfig) => {
      if(confirm(`確定要停止監控 ${app.name} 嗎?`)) {
          const newApp = { ...app, isMonitored: false };
          await saveApp(newApp);
          loadApps();
      }
  };

  if (loading) {
      return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      );
  }

  // Filter
  const myProducts = apps.filter(a => a.isMonitored);
  // Merge local company apps with stored ones that are not monitored
  const companyProducts = [...MOCK_COMPANY_PRODUCTS, ...apps.filter(a => !a.isMonitored && !a.id.startsWith('cp_'))].filter(
      (v,i,a)=>a.findIndex(t=>(t.name===v.name))===i && !myProducts.find(m => m.name === v.name)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">產品監控 Dashboard</h1>
          <p className="text-gray-500 mt-1">全公司產品數據與個人監控列表</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          新增外部產品
        </button>
      </div>

      {/* My Products Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={24}/> 我的監控產品
        </h2>
        
        {myProducts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-gray-500">您目前沒有監控中的產品。</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myProducts.map((app) => (
                    <ProductCard 
                        key={app.id} 
                        app={app} 
                        isMonitored={true}
                        onEdit={() => handleEditApp(app)}
                        onAction={() => handleStopMonitoring(app)}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Company Products Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="text-gray-500" size={24}/> 公司產品庫
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {companyProducts.map((app) => (
                <ProductCard 
                    key={app.id} 
                    app={app} 
                    isMonitored={false}
                    onEdit={() => handleEditApp(app)}
                    onAction={() => handleAddToMyProducts(app)}
                />
            ))}
        </div>
      </div>

      <AppConfigModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        existingApp={selectedApp}
        onSaved={loadApps}
      />
    </div>
  );
};

const ProductCard: React.FC<{ 
    app: AppConfig, 
    isMonitored: boolean, 
    onEdit: () => void,
    onAction: () => void
}> = ({ app, isMonitored, onEdit, onAction }) => {
  return (
    <div className={`bg-white rounded-xl border ${isMonitored ? 'border-blue-200 shadow-sm hover:shadow-md' : 'border-gray-200 opacity-80 hover:opacity-100'} transition-all overflow-hidden flex flex-col`}>
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm ${isMonitored ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-400'}`}>
            {app.name.charAt(0).toUpperCase()}
          </div>
          {isMonitored && (
             <button onClick={onEdit} className="text-gray-400 hover:text-blue-600 transition-colors">
                 <Settings2 size={18} />
             </button>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-1">{app.name}</h3>
        <p className="text-xs text-gray-500 mb-4 truncate">
            ID: {app.id.slice(0,8)}...
        </p>

        {isMonitored ? (
            <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                <div className="bg-blue-50 p-2 rounded text-xs">
                    <div className="text-blue-400 mb-1">週活躍</div>
                    <div className="font-bold text-blue-900">24K</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-xs">
                    <div className="text-green-400 mb-1">週下載</div>
                    <div className="font-bold text-green-900">5.2K</div>
                </div>
                 <div className="bg-purple-50 p-2 rounded text-xs">
                    <div className="text-purple-400 mb-1">留存</div>
                    <div className="font-bold text-purple-900">35%</div>
                </div>
            </div>
        ) : (
            <p className="text-sm text-gray-400 mb-6">尚未啟用監控與分析功能。</p>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
        {isMonitored ? (
             <>
                <Link
                    to={`/report/${app.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
                >
                    <BarChart3 size={16} />
                    分析報告
                </Link>
                <button onClick={onAction} className="text-gray-400 hover:text-red-500 px-2" title="停止監控">
                    <StopCircle size={20} />
                </button>
             </>
        ) : (
            <button 
                onClick={onAction}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
                <Plus size={16} /> 加入監控
            </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
