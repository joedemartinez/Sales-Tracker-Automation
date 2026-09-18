import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';
import { generateDailyReport, generateWeeklyReport, startScheduler, getSchedulerStatus } from './server/reportService';
import { generatePdfBuffer } from './server/pdfGenerator';
import { sendReportEmail, sendTestEmail } from './server/emailService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------- API ROUTES ----------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Sales REST endpoints
  app.get('/api/sales', (req, res) => {
    const { search, method, startDate, endDate } = req.query;
    let sales = store.getSales();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      sales = sales.filter(s =>
        s.customerName.toLowerCase().includes(q) ||
        s.productBought.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }

    if (method && typeof method === 'string' && method !== 'all') {
      sales = sales.filter(s => s.paymentMethod === method);
    }

    if (startDate && typeof startDate === 'string') {
      sales = sales.filter(s => s.date >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      sales = sales.filter(s => s.date <= endDate);
    }

    res.json({ sales });
  });

  app.post('/api/sales', (req, res) => {
    const { date, amount, quantity, customerName, productBought, paymentMethod, notes, time } = req.body;

    if (!amount || !customerName || !productBought || !paymentMethod) {
      return res.status(400).json({ error: 'Amount, customer name, product, and payment method are required.' });
    }

    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newSale = store.addSale({
      date: date || defaultDate,
      time: time || defaultTime,
      amount: Number(amount),
      quantity: Number(quantity) || 1,
      customerName: customerName.trim(),
      productBought: productBought.trim(),
      paymentMethod,
      notes: notes ? notes.trim() : undefined
    });

    res.status(201).json({ sale: newSale });
  });

  app.put('/api/sales/:id', (req, res) => {
    const updated = store.updateSale(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ sale: updated });
  });

  app.delete('/api/sales/:id', (req, res) => {
    const deleted = store.deleteSale(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ success: true });
  });

  app.post('/api/sales/seed', (req, res) => {
    const seeded = store.resetSalesToSeed();
    res.json({ message: 'Seed data restored', count: seeded.length });
  });

  // Real-time Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    const allSales = store.getSales();
    const todayStr = new Date().toISOString().split('T')[0];

    // Last 7 days range
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const todaySales = allSales.filter(s => s.date === todayStr);
    const weekSales = allSales.filter(s => s.date >= weekStartStr && s.date <= todayStr);

    const todayRevenue = todaySales.reduce((acc, s) => acc + s.amount, 0);
    const todayTransactions = todaySales.length;
    const todayUnitsSold = todaySales.reduce((acc, s) => acc + s.quantity, 0);
    const todayAov = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

    const weekRevenue = weekSales.reduce((acc, s) => acc + s.amount, 0);
    const weekTransactions = weekSales.length;
    const weekUnitsSold = weekSales.reduce((acc, s) => acc + s.quantity, 0);
    const weekAov = weekTransactions > 0 ? weekRevenue / weekTransactions : 0;

    // Hourly / Daily trend
    const trendMap = new Map<string, { revenue: number; count: number }>();
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      trendMap.set(dStr, { revenue: 0, count: 0 });
    }
    weekSales.forEach(s => {
      if (trendMap.has(s.date)) {
        const cur = trendMap.get(s.date)!;
        cur.revenue += s.amount;
        cur.count += 1;
      }
    });

    const revenueTrend = Array.from(trendMap.entries()).map(([dStr, val]) => {
      const dObj = new Date(dStr + 'T00:00:00');
      return {
        period: dObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: val.revenue,
        count: val.count
      };
    });

    // Payment breakdown
    const paymentMap = new Map<string, { count: number; total: number }>();
    ['Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment', 'Cash'].forEach(m => {
      paymentMap.set(m, { count: 0, total: 0 });
    });
    weekSales.forEach(s => {
      const cur = paymentMap.get(s.paymentMethod) || { count: 0, total: 0 };
      paymentMap.set(s.paymentMethod, {
        count: cur.count + 1,
        total: cur.total + s.amount
      });
    });

    const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method: method as any,
      count: data.count,
      total: data.total,
      percentage: weekRevenue > 0 ? (data.total / weekRevenue) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    // Top products
    const productMap = new Map<string, { units: number; revenue: number }>();
    weekSales.forEach(s => {
      const cur = productMap.get(s.productBought) || { units: 0, revenue: 0 };
      productMap.set(s.productBought, {
        units: cur.units + s.quantity,
        revenue: cur.revenue + s.amount
      });
    });

    const topProducts = Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      units: data.units,
      revenue: data.revenue,
      percentage: weekRevenue > 0 ? (data.revenue / weekRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    const config = store.getConfig();

    res.json({
      todayRevenue,
      todayTransactions,
      todayUnitsSold,
      todayAov,
      weekRevenue,
      weekTransactions,
      weekUnitsSold,
      weekAov,
      revenueTrend,
      paymentBreakdown,
      topProducts,
      recentSales: allSales.slice(0, 10),
      nextDailyAutomatedRun: `Today at ${config.dailyReportTime} (Evening)`,
      nextWeeklyAutomatedRun: `${config.weeklyReportDay} at ${config.weeklyReportTime}`
    });
  });

  // Reports REST endpoints
  app.get('/api/reports', (req, res) => {
    res.json({ reports: store.getReports() });
  });

  app.get('/api/reports/:id', (req, res) => {
    const report = store.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report });
  });

  app.post('/api/reports/generate', (req, res) => {
    const { type, date } = req.body;
    try {
      if (type === 'weekly') {
        const report = generateWeeklyReport(date);
        return res.json({ report, message: 'End-of-Week summary report generated successfully' });
      } else {
        const report = generateDailyReport(date);
        return res.json({ report, message: 'Daily evening sales summary report generated successfully' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // PDF Download / View endpoint
  app.get('/api/reports/:id/pdf', (req, res) => {
    const report = store.getReport(req.params.id);
    if (!report) {
      return res.status(404).send('Report not found');
    }

    try {
      const config = store.getConfig();
      const pdfBuffer = generatePdfBuffer(report, config);
      const filename = `${report.type}-sales-report-${report.startDate}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err: unknown) {
      console.error('Error generating PDF:', err);
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).send(`Error creating PDF: ${message}`);
    }
  });

  // Email report to manager
  app.post('/api/reports/:id/email', async (req, res) => {
    const report = store.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const { recipient, note } = req.body;
    try {
      const result = await sendReportEmail(report, recipient, note);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // Manager & Automation Configuration
  app.get('/api/config', (req, res) => {
    res.json({ config: store.getConfig() });
  });

  app.put('/api/config', (req, res) => {
    const updated = store.updateConfig(req.body);
    res.json({ config: updated });
  });

  // Email dispatch logs
  app.get('/api/email-logs', (req, res) => {
    res.json({ logs: store.getEmailLogs() });
  });

  app.post('/api/email-test', async (req, res) => {
    const { recipient } = req.body;
    const config = store.getConfig();
    const target = recipient || config.managerEmail;
    try {
      const result = await sendTestEmail(target);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // Scheduler status
  app.get('/api/scheduler/status', (req, res) => {
    res.json(getSchedulerStatus());
  });

  // ---------------- VITE MIDDLEWARE & STATIC SERVING ----------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start automated evening/weekend scheduler
  startScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Tracker server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
