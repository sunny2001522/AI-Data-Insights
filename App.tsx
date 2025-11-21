import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AppSetup from './pages/AppSetup';
import ReportView from './pages/ReportView';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AppSetup />} />
            <Route path="/report/:id" element={<ReportView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;