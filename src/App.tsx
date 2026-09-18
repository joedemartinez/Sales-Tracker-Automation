import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SalesLedgerView } from './components/SalesLedgerView';
import { ReportsView } from './components/ReportsView';
import { ManagerEmailHub } from './components/ManagerEmailHub';
import { RecordSaleModal } from './components/RecordSaleModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { Sale, SalesReport, DashboardStats, ManagerConfig, EmailDispatchLog } from './types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'reports' | 'manager'>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [config, setConfig] = useState<ManagerConfig | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSimulatingSale, setIsSimulatingSale] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      const [salesRes, statsRes, reportsRes, configRes, emailRes] = await Promise.all([
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/config').then(r => r.json()),
        fetch('/api/email-logs').then(r => r.json()),
      ]);

      if (salesRes.sales) setSales(salesRes.sales);
      if (statsRes) setStats(statsRes);
      if (reportsRes.reports) setReports(reportsRes.reports);
      if (configRes.config) setConfig(configRes.config);
      if (emailRes.logs) setEmailLogs(emailRes.logs);
    } catch (err) {
      console.error('Error fetching data from sales API:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Real-time polling every 8 seconds
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handler for newly created sale
  const handleSaleCreated = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    loadData();
    showToast(`Sale #${newSale.id.slice(-4)} recorded: $${newSale.amount.toFixed(2)} for ${newSale.customerName}`);
  };

  // Handler for deleting sale
  const handleDeleteSale = async (id: string) => {
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sale');
      setSales(prev => prev.filter(s => s.id !== id));
      loadData();
      showToast('Sale record deleted successfully', 'info');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message, 'error');
    }
  };

  // Handler for resetting seed data
  const handleResetSeedData = async () => {
    try {
      const res = await fetch('/api/sales/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset seed data');
      await loadData();
      showToast('Realistic seed sales data reloaded!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message, 'error');
    }
  };

  // Handler for triggering daily or weekly report
  const handleGenerateReport = async (type: 'daily' | 'weekly', date?: string) => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, date })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate report');
      }

      const data = await res.json();
      setReports(prev => [data.report, ...prev.filter(r => r.id !== data.report.id)]);
      setSelectedReport(data.report);
      loadData();
      showToast(`${type === 'daily' ? 'Daily' : 'Weekly'} summary report compiled & PDF generated!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message, 'error');
      throw err;
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Quick evening report trigger from navbar/banner
  const handleTriggerEveningReport = () => {
    handleGenerateReport('daily');
  };

  // Handler for emailing report
  const handleEmailReport = async (reportId: string, customRecipient?: string, note?: string) => {
    const res = await fetch(`/api/reports/${reportId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: customRecipient, note })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch email');
    }

    const data = await res.json();
    loadData();
    showToast(data.message || 'Report email successfully dispatched to manager!');
  };

  // Handler for updating manager configuration
  const handleUpdateConfig = async (newConfig: Partial<ManagerConfig>) => {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });

    if (!res.ok) throw new Error('Failed to update config');
    const data = await res.json();
    setConfig(data.config);
    showToast('Manager settings updated successfully');
  };

  // Handler for test email
  const handleSendTestEmail = async (recipient: string) => {
    const res = await fetch('/api/email-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient })
    });

    if (!res.ok) throw new Error('Failed to send test email');
    loadData();
    showToast(`Test verification email dispatched to ${recipient}`);
  };

  // Simulate an incoming live sale
  const handleSimulateSale = async () => {
    setIsSimulatingSale(true);
    const mockProducts = [
      { name: 'Ergonomic Desk Chair', price: 280 },
      { name: 'UltraWide Monitor 34"', price: 499 },
      { name: 'Mechanical Keyboard RGB', price: 129 },
      { name: 'Wireless Headset Pro', price: 199 },
      { name: 'USB-C Docking Station', price: 165 },
    ];
    const mockCustomers = [
      'Alexander Vance', 'Grace Hopper', 'Clara Schumann', 'Julian Hayes', 'Maya Lin'
    ];
    const methods: Sale['paymentMethod'][] = ['Credit Card', 'Debit Card', 'Mobile Payment', 'Bank Transfer'];

    const prod = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    const cust = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const qty = Math.floor(Math.random() * 2) + 1;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: prod.price * qty,
          quantity: qty,
          customerName: cust,
          productBought: prod.name,
          paymentMethod: method,
          notes: 'Live simulated transaction'
        })
      });

      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      setSales(prev => [data.sale, ...prev]);
      await loadData();
      showToast(`⚡ Live incoming sale captured: $${(prod.price * qty).toFixed(2)} from ${cust}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(message, 'error');
    } finally {
      setIsSimulatingSale(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans flex flex-col">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRecordSale={() => setIsRecordModalOpen(true)}
        onTriggerEveningReport={handleTriggerEveningReport}
        config={config}
        isGeneratingReport={isGeneratingReport}
      />

      {/* Toast Notification Floating Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 max-w-md ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            config={config}
            onOpenRecordSale={() => setIsRecordModalOpen(true)}
            onTriggerEveningReport={handleTriggerEveningReport}
            onSimulateSale={handleSimulateSale}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            isSimulating={isSimulatingSale}
          />
        )}

        {activeTab === 'sales' && (
          <SalesLedgerView
            sales={sales}
            onOpenRecordSale={() => setIsRecordModalOpen(true)}
            onDeleteSale={handleDeleteSale}
            onResetSeedData={handleResetSeedData}
            currencySymbol={config?.currencySymbol || '$'}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            reports={reports}
            onGenerateReport={handleGenerateReport}
            onSelectReport={(r) => setSelectedReport(r)}
            onEmailReport={(id) => handleEmailReport(id)}
            config={config}
            isGenerating={isGeneratingReport}
          />
        )}

        {activeTab === 'manager' && (
          <ManagerEmailHub
            config={config}
            onUpdateConfig={handleUpdateConfig}
            emailLogs={emailLogs}
            onSendTestEmail={handleSendTestEmail}
          />
        )}
      </main>

      {/* Record Sale Modal */}
      <RecordSaleModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSaleCreated={handleSaleCreated}
      />

      {/* Report Detail & PDF Viewer Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onEmailReport={handleEmailReport}
        config={config}
      />
    </div>
  );
}
