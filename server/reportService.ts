import { Sale, SalesReport, ProductBreakdown, PaymentBreakdown, TimeBreakdown } from '../src/types';
import { store } from './store';
import { sendReportEmail } from './emailService';

export function calculateReportMetrics(
  sales: Sale[],
  type: 'daily' | 'weekly',
  periodLabel: string,
  startDate: string,
  endDate: string,
  isAutomated: boolean
): SalesReport {
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const totalTransactions = sales.length;
  const totalUnitsSold = sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Product breakdown
  const productMap = new Map<string, { units: number; revenue: number }>();
  sales.forEach(s => {
    const prev = productMap.get(s.productBought) || { units: 0, revenue: 0 };
    productMap.set(s.productBought, {
      units: prev.units + (Number(s.quantity) || 0),
      revenue: prev.revenue + (Number(s.amount) || 0)
    });
  });

  const productBreakdown: ProductBreakdown[] = Array.from(productMap.entries())
    .map(([product, data]) => ({
      product,
      units: data.units,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProduct = productBreakdown.length > 0 ? productBreakdown[0].product : 'None';

  // Payment breakdown
  const paymentMap = new Map<Sale['paymentMethod'], { count: number; total: number }>();
  const validMethods: Sale['paymentMethod'][] = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment', 'Cash'];
  validMethods.forEach(m => paymentMap.set(m, { count: 0, total: 0 }));

  sales.forEach(s => {
    const prev = paymentMap.get(s.paymentMethod) || { count: 0, total: 0 };
    paymentMap.set(s.paymentMethod, {
      count: prev.count + 1,
      total: prev.total + (Number(s.amount) || 0)
    });
  });

  const paymentBreakdown: PaymentBreakdown[] = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total);

  const topPaymentMethod = paymentBreakdown.length > 0 && paymentBreakdown[0].total > 0
    ? paymentBreakdown[0].method
    : 'Credit Card';

  // Time breakdown (Hourly for daily, Daily for weekly)
  const timeBreakdown: TimeBreakdown[] = [];
  if (type === 'daily') {
    // 8am to 8pm hourly buckets
    const hourMap = new Map<number, { revenue: number; count: number }>();
    for (let h = 8; h <= 20; h++) {
      hourMap.set(h, { revenue: 0, count: 0 });
    }
    sales.forEach(s => {
      let h = 12;
      if (s.time) {
        h = parseInt(s.time.split(':')[0], 10);
      }
      if (hourMap.has(h)) {
        const cur = hourMap.get(h)!;
        cur.revenue += s.amount;
        cur.count += 1;
      }
    });

    hourMap.forEach((val, h) => {
      const label = `${h.toString().padStart(2, '0')}:00`;
      timeBreakdown.push({
        period: label,
        revenue: val.revenue,
        count: val.count
      });
    });
  } else {
    // Last 7 days breakdown
    const dayMap = new Map<string, { revenue: number; count: number }>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      dayMap.set(dStr, { revenue: 0, count: 0 });
    }

    sales.forEach(s => {
      if (dayMap.has(s.date)) {
        const cur = dayMap.get(s.date)!;
        cur.revenue += s.amount;
        cur.count += 1;
      }
    });

    dayMap.forEach((val, dStr) => {
      const dObj = new Date(dStr + 'T00:00:00');
      const dayName = dObj.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      timeBreakdown.push({
        period: dayName,
        revenue: val.revenue,
        count: val.count
      });
    });
  }

  const reportId = `rep-${type}-${startDate}-${Date.now().toString(36)}`;

  return {
    id: reportId,
    type,
    periodLabel,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    isAutomated,
    totalRevenue,
    totalTransactions,
    totalUnitsSold,
    averageOrderValue,
    topProduct,
    topPaymentMethod,
    productBreakdown,
    paymentBreakdown,
    timeBreakdown,
    salesList: [...sales]
  };
}

export function generateDailyReport(dateStr?: string, isAutomated = false): SalesReport {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const allSales = store.getSales();
  const sales = allSales.filter(s => s.date === targetDate);
  
  const dObj = new Date(targetDate + 'T00:00:00');
  const dateFormatted = dObj.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const periodLabel = `Daily Summary - ${dateFormatted}`;

  const report = calculateReportMetrics(
    sales,
    'daily',
    periodLabel,
    targetDate,
    targetDate,
    isAutomated
  );

  store.saveReport(report);

  const config = store.getConfig();
  if (config.autoSendDaily) {
    sendReportEmail(report).catch(err => {
      console.error('Error auto-dispatching daily report email:', err);
    });
  }

  return report;
}

export function generateWeeklyReport(endDateStr?: string, isAutomated = false): SalesReport {
  const targetEnd = endDateStr ? new Date(endDateStr + 'T23:59:59') : new Date();
  const targetStart = new Date(targetEnd);
  targetStart.setDate(targetStart.getDate() - 6);
  targetStart.setHours(0, 0, 0, 0);

  const startStr = targetStart.toISOString().split('T')[0];
  const endStr = targetEnd.toISOString().split('T')[0];

  const allSales = store.getSales();
  const sales = allSales.filter(s => s.date >= startStr && s.date <= endStr);

  const sFormatted = targetStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const eFormatted = targetEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const periodLabel = `Weekly Summary - ${sFormatted} to ${eFormatted}`;

  const report = calculateReportMetrics(
    sales,
    'weekly',
    periodLabel,
    startStr,
    endStr,
    isAutomated
  );

  store.saveReport(report);

  const config = store.getConfig();
  if (config.autoSendWeekly) {
    sendReportEmail(report).catch(err => {
      console.error('Error auto-dispatching weekly report email:', err);
    });
  }

  return report;
}

// Background Automated Scheduler
let lastAutomatedDailyRun = '';
let lastAutomatedWeeklyRun = '';

export function startScheduler() {
  console.log('Automated Daily Evening & End-of-Week Reporting Scheduler started.');

  // Check every 30 seconds
  setInterval(() => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      
      const config = store.getConfig();

      // Daily Evening Check
      // Matches configured time (default 18:00)
      if (currentTimeStr === config.dailyReportTime && lastAutomatedDailyRun !== todayStr) {
        console.log(`[Scheduler] Evening trigger reached (${currentTimeStr}). Generating daily sales summary report...`);
        lastAutomatedDailyRun = todayStr;
        generateDailyReport(todayStr, true);
      }

      // End-of-Week Check
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = days[now.getDay()];
      const weekKey = `${todayStr}-week`;

      if (
        currentDayName === config.weeklyReportDay &&
        currentTimeStr === config.weeklyReportTime &&
        lastAutomatedWeeklyRun !== weekKey
      ) {
        console.log(`[Scheduler] End-of-Week trigger reached (${currentDayName} ${currentTimeStr}). Generating weekly summary report...`);
        lastAutomatedWeeklyRun = weekKey;
        generateWeeklyReport(todayStr, true);
      }
    } catch (err) {
      console.error('Error in reporting scheduler loop:', err);
    }
  }, 30000);
}

export function getSchedulerStatus() {
  const config = store.getConfig();
  const now = new Date();
  
  return {
    dailyReportTime: config.dailyReportTime,
    weeklyReportDay: config.weeklyReportDay,
    weeklyReportTime: config.weeklyReportTime,
    lastAutomatedDailyRun,
    lastAutomatedWeeklyRun,
    currentTime: now.toTimeString().split(' ')[0],
    currentDate: now.toISOString().split('T')[0]
  };
}
