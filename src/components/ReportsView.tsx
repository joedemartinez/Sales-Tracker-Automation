import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Download,
  Mail,
  Send,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { SalesReport, ManagerConfig } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ReportsViewProps {
  reports: SalesReport[];
  onGenerateReport: (type: 'daily' | 'weekly', date?: string) => Promise<void>;
  onSelectReport: (report: SalesReport) => void;
  onEmailReport: (reportId: string) => Promise<void>;
  config: ManagerConfig | null;
  isGenerating: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  onGenerateReport,
  onSelectReport,
  onEmailReport,
  config,
  isGenerating,
}) => {
  const [selectedDailyDate, setSelectedDailyDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedWeeklyDate, setSelectedWeeklyDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currency = config?.currencySymbol || '$';

  const handleGenerateDaily = async () => {
    try {
      await onGenerateReport('daily', selectedDailyDate);
      setActionNotice(`Daily report for ${selectedDailyDate} compiled successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setActionNotice(`Failed to generate daily report: ${message}`);
    }
  };

  const handleGenerateWeekly = async () => {
    try {
      await onGenerateReport('weekly', selectedWeeklyDate);
      setActionNotice(`End-of-Week summary report generated successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setActionNotice(`Failed to generate weekly report: ${message}`);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-blue-600 font-bold ml-3">✕</button>
        </div>
      )}

      {/* Primary Action Generators (Daily & Weekly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Daily Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Summary Report (PDF)</h3>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Auto-compiles each evening at {config?.dailyReportTime || '18:00'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Produces a publication-ready PDF detailing total revenue, orders, units sold, product ranking, and payment gateway distribution. Automatically attached and emailed to manager {config?.managerEmail}.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs font-semibold text-slate-600">Select Date:</span>
                <input
                  type="date"
                  value={selectedDailyDate}
                  onChange={(e) => setSelectedDailyDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">PDF & Email dispatch</span>
            <button
              id="btn-generate-daily-report"
              onClick={handleGenerateDaily}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Daily PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* End-of-Week Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full pointer-events-none -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-teal-100 text-teal-700">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">End-of-Week Summary Report (PDF)</h3>
                <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Auto-compiles every {config?.weeklyReportDay || 'Sunday'} at {config?.weeklyReportTime || '19:00'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Aggregates the past 7 days with day-by-day revenue velocity, top weekly product contributors, and consolidated payment receipts for executive review.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs font-semibold text-slate-600">Week Ending:</span>
                <input
                  type="date"
                  value={selectedWeeklyDate}
                  onChange={(e) => setSelectedWeeklyDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">PDF & Email dispatch</span>
            <button
              id="btn-generate-weekly-report"
              onClick={handleGenerateWeekly}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate End-of-Week PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Archive */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Archive Filter Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Generated Reports Archive</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access past daily and weekly reports, view embedded PDF, or dispatch to manager email
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Reports ({reports.length})
            </button>
            <button
              onClick={() => setFilterType('daily')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterType === 'daily' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setFilterType('weekly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterType === 'weekly' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* List of Reports */}
        <div className="divide-y divide-slate-100">
          {filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No reports generated yet. Click "Generate Daily PDF Report" or "Generate End-of-Week PDF" above!
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left side: Report info */}
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    report.type === 'daily'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        report.type === 'daily'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {report.type === 'daily' ? 'DAILY EVENING' : 'WEEKLY SUMMARY'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{report.periodLabel}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Total Revenue: <strong className="text-slate-800">{formatCurrency(report.totalRevenue, currency)}</strong></span>
                      <span>•</span>
                      <span>{report.totalTransactions} transactions</span>
                      <span>•</span>
                      <span>{report.totalUnitsSold} units</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">
                        Generated {new Date(report.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Email status badge */}
                    {report.emailStatus?.sent && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>Dispatched to {report.emailStatus.recipient || config?.managerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onSelectReport(report)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Report</span>
                  </button>

                  <a
                    href={`/api/reports/${report.id}/pdf`}
                    download={`${report.type}-sales-report-${report.startDate}.pdf`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">PDF</span>
                  </a>

                  <button
                    onClick={() => onEmailReport(report.id)}
                    title="Send PDF to Manager"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Manager</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
