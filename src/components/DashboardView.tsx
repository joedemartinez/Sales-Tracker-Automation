import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Zap,
  Sparkles,
  CreditCard,
  User
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { DashboardStats, Sale, ManagerConfig } from '../types';
import { formatCurrency, getPaymentMethodColor } from '../utils/formatters';

interface DashboardViewProps {
  stats: DashboardStats | null;
  config: ManagerConfig | null;
  onOpenRecordSale: () => void;
  onTriggerEveningReport: () => void;
  onSimulateSale: () => void;
  onNavigateToTab: (tab: 'sales' | 'reports' | 'manager') => void;
  isSimulating: boolean;
}

const PAYMENT_COLORS: Record<string, string> = {
  'Credit Card': '#2563eb', // blue-600
  'Debit Card': '#6366f1',  // indigo-500
  'Mobile Payment': '#10b981', // emerald-500
  'Bank Transfer': '#f59e0b', // amber-500
  'Cash': '#0d9488', // teal-600
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  config,
  onOpenRecordSale,
  onTriggerEveningReport,
  onSimulateSale,
  onNavigateToTab,
  isSimulating,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading real-time sales metrics...</p>
        </div>
      </div>
    );
  }

  const currency = config?.currencySymbol || '$';

  return (
    <div className="space-y-6">
      {/* Automated Reporting & Schedule Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-sm border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                Automation Daemon Active
              </span>
              <span className="text-xs text-slate-300">
                Next Evening Daily Run: <strong className="text-white font-medium">{stats.nextDailyAutomatedRun}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Automated Sales Intelligence & PDF Dispatch
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every evening at <span className="font-semibold text-white">{config?.dailyReportTime || '18:00'}</span>, 
              the system automatically generates an itemized daily PDF report and dispatches it directly to manager{' '}
              <span className="font-semibold text-blue-300">{config?.managerEmail || 'Joshuaagyemang1@gmail.com'}</span>. 
              End-of-week summaries trigger every {config?.weeklyReportDay || 'Sunday'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onSimulateSale}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors shadow-xs"
              title="Simulate an incoming sale in real-time"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulating ? 'Simulating...' : 'Simulate Live Sale'}</span>
            </button>

            <button
              onClick={onTriggerEveningReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compile Evening PDF Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Sales Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.todayRevenue, currency)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{stats.todayTransactions} transactions</span>
              <span>•</span>
              <span>{stats.todayUnitsSold} units today</span>
            </div>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              7-Day Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.weekRevenue, currency)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{stats.weekTransactions} total orders</span>
              <span>•</span>
              <span>{stats.weekUnitsSold} units</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.todayAov || stats.weekAov, currency)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span>Today: {formatCurrency(stats.todayAov, currency)} / 7-Day: {formatCurrency(stats.weekAov, currency)}</span>
            </div>
          </div>
        </div>

        {/* Units Sold / Velocity */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Units Sold
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.weekUnitsSold} <span className="text-sm font-normal text-slate-500">units</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Active
              </span>
              <span>Across {stats.topProducts.length} product lines</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales Revenue Trajectory</h3>
              <p className="text-xs text-slate-500">Daily gross revenue volume across the current week</p>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              Updated Live
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={val => `${currency}${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown (1 column) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Payment Methods Share</h3>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-3">Gross revenue distribution by payment gateway</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="method"
                  >
                    {stats.paymentBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PAYMENT_COLORS[entry.method] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toFixed(2)}`, 'Collected']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {stats.paymentBreakdown.map(p => (
              <div key={p.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PAYMENT_COLORS[p.method] || '#64748b' }}
                  ></span>
                  <span className="text-slate-600 font-medium">{p.method}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-semibold">{formatCurrency(p.total, currency)}</span>
                  <span className="text-slate-400 text-[11px] w-9 text-right">{p.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Products & Real-Time Sales Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
              <p className="text-xs text-slate-500">Highest volume contributors for this reporting cycle</p>
            </div>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View in Report →
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.topProducts.map((p, idx) => (
              <div key={p.product} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{p.product}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{p.units} units</span>
                    <span className="font-bold text-slate-900">{formatCurrency(p.revenue, currency)}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(8, p.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Recent Sales Feed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Live Transaction Stream</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <button
                onClick={() => onNavigateToTab('sales')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                All Sales Ledger →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Latest incoming sales captured by system</p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {stats.recentSales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {sale.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{sale.customerName}</span>
                        <span className="text-slate-400 font-normal">({sale.quantity}x)</span>
                      </div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                        {sale.productBought}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(sale.amount, currency)}
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-medium border ${getPaymentMethodColor(sale.paymentMethod)}`}>
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Auto-persisted in local transaction store
            </span>
            <button
              onClick={onOpenRecordSale}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              + Record manual sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
