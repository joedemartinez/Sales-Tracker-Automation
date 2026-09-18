export type PaymentMethod = 
  | 'Cash' 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'Bank Transfer' 
  | 'Mobile Payment';

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  amount: number;
  quantity: number;
  customerName: string;
  productBought: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface ProductBreakdown {
  product: string;
  units: number;
  revenue: number;
  percentage: number;
}

export interface PaymentBreakdown {
  method: PaymentMethod;
  count: number;
  total: number;
  percentage: number;
}

export interface TimeBreakdown {
  period: string; // e.g. "09:00" or "Mon 15"
  revenue: number;
  count: number;
}

export interface SalesReport {
  id: string;
  type: 'daily' | 'weekly';
  periodLabel: string; // e.g. "Daily Report - Friday, Sep 18, 2026" or "Weekly Summary - Sep 14 to Sep 20, 2026"
  startDate: string;
  endDate: string;
  generatedAt: string;
  isAutomated: boolean;
  totalRevenue: number;
  totalTransactions: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  topProduct: string;
  topPaymentMethod: string;
  productBreakdown: ProductBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
  timeBreakdown: TimeBreakdown[];
  salesList: Sale[];
  emailStatus?: {
    sent: boolean;
    sentAt?: string;
    recipient?: string;
    status: 'sent' | 'simulated' | 'failed' | 'pending';
    error?: string;
  };
}

export interface ManagerConfig {
  managerName: string;
  managerEmail: string;
  dailyReportTime: string; // e.g. "18:00" (6 PM evening)
  weeklyReportDay: 'Sunday' | 'Saturday' | 'Friday';
  weeklyReportTime: string; // e.g. "19:00"
  autoSendDaily: boolean;
  autoSendWeekly: boolean;
  companyName: string;
  currencySymbol: string;
  smtpConfig?: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
}

export interface EmailDispatchLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  reportType: 'daily' | 'weekly' | 'test';
  reportId?: string;
  periodLabel: string;
  status: 'delivered' | 'simulated' | 'failed';
  pdfFileName: string;
  summaryText: string;
  details?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayTransactions: number;
  todayUnitsSold: number;
  todayAov: number;
  weekRevenue: number;
  weekTransactions: number;
  weekUnitsSold: number;
  weekAov: number;
  revenueTrend: TimeBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
  topProducts: ProductBreakdown[];
  recentSales: Sale[];
  nextDailyAutomatedRun: string;
  nextWeeklyAutomatedRun: string;
}
