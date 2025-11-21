import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, PlusCircle, FileText } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '總覽 Dashboard', icon: LayoutDashboard },
    { path: '/add', label: '新增 App', icon: PlusCircle },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          AutoAnalytics <span className="text-xs text-gray-400 block font-normal mt-1">Gemini Powered</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 text-gray-500 text-sm px-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          System Online
        </div>
      </div>
    </div>
  );
};

export default Sidebar;