import React, { useState } from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Settings,
  Server,
  FileCheck,
  ShieldCheck,
  Inbox
} from 'lucide-react';
import { ManagerConfig, EmailDispatchLog } from '../types';

interface ManagerEmailHubProps {
  config: ManagerConfig | null;
  onUpdateConfig: (newConfig: Partial<ManagerConfig>) => Promise<void>;
  emailLogs: EmailDispatchLog[];
  onSendTestEmail: (recipient: string) => Promise<void>;
}

export const ManagerEmailHub: React.FC<ManagerEmailHubProps> = ({
  config,
  onUpdateConfig,
  emailLogs,
  onSendTestEmail,
}) => {
  const [managerName, setManagerName] = useState(config?.managerName || 'Operations Manager');
  const [managerEmail, setManagerEmail] = useState(config?.managerEmail || 'Joshuaagyemang1@gmail.com');
  const [dailyReportTime, setDailyReportTime] = useState(config?.dailyReportTime || '18:00');
  const [weeklyReportDay, setWeeklyReportDay] = useState<'Sunday' | 'Saturday' | 'Friday'>(config?.weeklyReportDay || 'Sunday');
  const [weeklyReportTime, setWeeklyReportTime] = useState(config?.weeklyReportTime || '19:00');
  const [autoSendDaily, setAutoSendDaily] = useState(config?.autoSendDaily ?? true);
  const [autoSendWeekly, setAutoSendWeekly] = useState(config?.autoSendWeekly ?? true);
  const [companyName, setCompanyName] = useState(config?.companyName || 'Apex Commercial Retail & Sales');

  // SMTP state
  const [smtpEnabled, setSmtpEnabled] = useState(config?.smtpConfig?.enabled ?? false);
  const [smtpHost, setSmtpHost] = useState(config?.smtpConfig?.host || '');
  const [smtpPort, setSmtpPort] = useState(config?.smtpConfig?.port?.toString() || '587');
  const [smtpUser, setSmtpUser] = useState(config?.smtpConfig?.user || '');
  const [smtpPass, setSmtpPass] = useState(config?.smtpConfig?.pass || '');
  const [smtpFrom, setSmtpFrom] = useState(config?.smtpConfig?.from || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveNotice(null);
    try {
      await onUpdateConfig({
        managerName,
        managerEmail,
        dailyReportTime,
        weeklyReportDay,
        weeklyReportTime,
        autoSendDaily,
        autoSendWeekly,
        companyName,
        smtpConfig: {
          enabled: smtpEnabled,
          host: smtpHost,
          port: parseInt(smtpPort, 10) || 587,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom || `sales-reports@${smtpHost || 'apexretail.internal'}`
        }
      });
      setSaveNotice('Manager configuration and automation schedules saved successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSaveNotice(`Error saving: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestNotice(null);
    try {
      await onSendTestEmail(managerEmail);
      setTestNotice(`Verification email test dispatched to ${managerEmail}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestNotice(`Failed to dispatch test: ${message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <span>{saveNotice}</span>
          <button onClick={() => setSaveNotice(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {testNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <span>{testNotice}</span>
          <button onClick={() => setTestNotice(null)} className="text-blue-700 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Automation & Recipient Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Automated Reporting & Manager Dispatch Settings</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure timing and recipient rules for evening daily sales summaries and end-of-week PDF reports.
              </p>
            </div>

            {/* Recipient details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Email Address (Report Target)
                </label>
                <input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  All automated PDFs will be dispatched to this inbox.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
            </div>

            {/* Company / Brand Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Store Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Daily Evening Schedule */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    Daily Evening Report Automation
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSendDaily}
                    onChange={(e) => setAutoSendDaily(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Evening Trigger Time (24h format):
                  </label>
                  <input
                    type="time"
                    value={dailyReportTime}
                    onChange={(e) => setDailyReportTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Default 18:00 (6:00 PM evening)
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center">
                  <p>
                    Compiles itemized sales transactions between 00:00 and trigger time, formats executive PDF, and dispatches to manager.
                  </p>
                </div>
              </div>
            </div>

            {/* End of Week Schedule */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    End-of-Week Summary Automation
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSendWeekly}
                    onChange={(e) => setAutoSendWeekly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Weekly Trigger Day:
                  </label>
                  <select
                    value={weeklyReportDay}
                    onChange={(e) => setWeeklyReportDay(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Sunday">Sunday (Default End of Week)</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Weekly Trigger Time:
                  </label>
                  <input
                    type="time"
                    value={weeklyReportTime}
                    onChange={(e) => setWeeklyReportTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Optional Custom SMTP Accordion */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    Custom SMTP Delivery Server (Optional)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtpEnabled}
                    onChange={(e) => setSmtpEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-800"></div>
                </label>
              </div>

              {smtpEnabled ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com or mail.company.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">SMTP Port</label>
                    <input
                      type="text"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">SMTP Username</label>
                    <input
                      type="text"
                      placeholder="user@example.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-2">
                  When disabled, emails are automatically logged to the Manager Outbox stream with complete HTML bodies and verified downloadable PDF attachments.
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting || !managerEmail}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
              >
                {isTesting ? 'Sending test...' : 'Send Test Notification'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings & Schedules'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Outgoing Email Log */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <span>Manager Outbox & Dispatch History</span>
                </h3>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                  {emailLogs.length} logs
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Real-time delivery verification logs for executive reports dispatched to manager.
              </p>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {emailLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No emails dispatched yet. Trigger an evening report or test notification to view the outbox log.
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">
                          {log.subject}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        To: <strong className="text-slate-800">{log.recipient}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{log.status === 'delivered' ? 'Delivered via SMTP' : 'Delivered to Manager Outbox'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📎 {log.pdfFileName}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <a
                href={`mailto:${managerEmail}?subject=Sales%20Reporting%20System%20Verification&body=System%20is%20configured%20to%20send%20daily%20evening%20sales%20reports%20to%20${managerEmail}.`}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in Default Email Client (mailto:)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
