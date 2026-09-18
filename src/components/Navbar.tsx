import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  MailCheck,
  PlusCircle,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';
import { ManagerConfig } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'sales' | 'reports' | 'manager';
  setActiveTab: (tab: 'dashboard' | 'sales' | 'reports' | 'manager') => void;
  onOpenRecordSale: () => void;
  onTriggerEveningReport: () => void;
  config: ManagerConfig | null;
  isGeneratingReport: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRecordSale,
  onTriggerEveningReport,
  config,
  isGeneratingReport,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Automated Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-black text-lg">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  SalesPulse
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live Reporting
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Evening PDF: {config?.dailyReportTime || '18:00'}</span>
                <span>•</span>
                <span>Manager: {config?.managerEmail || 'Joshuaagyemang1@gmail.com'}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Real-Time Dashboard</span>
            </button>

            <button
              id="nav-tab-sales"
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sales'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Sales Ledger</span>
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>PDF Reports</span>
            </button>

            <button
              id="nav-tab-manager"
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manager'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MailCheck className="w-4 h-4" />
              <span>Email & Automation</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-trigger-evening-report"
              onClick={onTriggerEveningReport}
              disabled={isGeneratingReport}
              title="Manually trigger today's daily evening summary and dispatch to manager"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Run Evening Report</span>
                </>
              )}
            </button>

            <button
              id="btn-open-record-sale"
              onClick={onOpenRecordSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-200 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[70px] py-1.5 text-xs text-center font-medium rounded-md ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 min-w-[70px] py-1.5 text-xs text-center font-medium rounded-md ${
              activeTab === 'sales' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-[70px] py-1.5 text-xs text-center font-medium rounded-md ${
              activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex-1 min-w-[70px] py-1.5 text-xs text-center font-medium rounded-md ${
              activeTab === 'manager' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Automation
          </button>
        </div>
      </div>
    </header>
  );
};
