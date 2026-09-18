import React, { useState } from 'react';
import {
  X,
  Download,
  Mail,
  FileText,
  Calendar,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Package,
  Send,
  ExternalLink
} from 'lucide-react';
import { SalesReport, ManagerConfig } from '../types';
import { formatCurrency, getPaymentMethodColor } from '../utils/formatters';

interface ReportDetailModalProps {
  report: SalesReport | null;
  onClose: () => void;
  onEmailReport: (reportId: string, customRecipient?: string, note?: string) => Promise<void>;
  config: ManagerConfig | null;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEmailReport,
  config,
}) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [recipient, setRecipient] = useState(config?.managerEmail || '');
  const [note, setNote] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'pdf'>('summary');

  if (!report) return null;

  const currency = config?.currencySymbol || '$';
  const pdfUrl = `/api/reports/${report.id}/pdf`;

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailSentNotice(null);
    try {
      await onEmailReport(report.id, recipient, note);
      setEmailSentNotice(`Report successfully dispatched with attached PDF to ${recipient}!`);
      setNote('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setEmailSentNotice(`Error sending email: ${message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                report.type === 'daily'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-teal-100 text-teal-800'
              }`}>
                {report.type === 'daily' ? 'DAILY EVENING SUMMARY' : 'END-OF-WEEK SUMMARY'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">ID: {report.id}</span>
              {report.emailStatus?.sent && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  Emailed to Manager
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{report.periodLabel}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compiled {new Date(report.generatedAt).toLocaleString()} • {report.isAutomated ? 'Automated Scheduled Trigger' : 'On-Demand Execution'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Itemized Records ({report.salesList.length})
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Embedded PDF View</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download={`${report.type}-sales-report-${report.startDate}.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
          </div>
        </div>

        {emailSentNotice && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <span>{emailSentNotice}</span>
            <button onClick={() => setEmailSentNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {activeTab === 'summary' && (
            <>
              {/* 4 Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Revenue</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {formatCurrency(report.totalRevenue, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Transactions</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {report.totalTransactions} <span className="text-xs font-normal text-slate-500">orders</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Units</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {report.totalUnitsSold} <span className="text-xs font-normal text-slate-500">items</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Average Order</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {formatCurrency(report.averageOrderValue, currency)}
                  </div>
                </div>
              </div>

              {/* Product & Payment Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Breakdown */}
                <div className="p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    Product Performance Ranking
                  </h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {report.productBreakdown.map((prod) => (
                      <div key={prod.product} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <div>
                          <div className="font-semibold text-slate-800">{prod.product}</div>
                          <div className="text-[11px] text-slate-400">{prod.units} units sold</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatCurrency(prod.revenue, currency)}</div>
                          <div className="text-[11px] text-slate-500">{prod.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Payment Gateway Distribution
                  </h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {report.paymentBreakdown.map((pm) => (
                      <div key={pm.method} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPaymentMethodColor(pm.method)}`}>
                            {pm.method}
                          </span>
                          <span className="text-slate-500">({pm.count} txns)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatCurrency(pm.total, currency)}</div>
                          <div className="text-[11px] text-slate-500">{pm.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Send to Manager Action Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email PDF Summary to Manager
                  </h4>
                  <span className="text-[11px] text-slate-500">Attaches exact verified PDF file</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Manager Recipient Email:
                    </label>
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="manager@company.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Executive Note (Optional):
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Exceeded Friday targets; high chair volume."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !recipient.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {isSendingEmail ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Dispatching with PDF...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Report to Manager Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sales' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date/Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.salesList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-500">{s.date} {s.time || ''}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{s.customerName}</td>
                      <td className="py-2 px-3 text-slate-700">{s.productBought}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700">{s.quantity}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(s.amount, currency)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] border ${getPaymentMethodColor(s.paymentMethod)}`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="w-full h-[520px] rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              <iframe
                src={pdfUrl}
                title="PDF Report Viewer"
                className="w-full h-full border-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Report PDF format compliant with standard A4 executive printer specs
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
