import fs from 'fs';
import path from 'path';
import { Sale, SalesReport, ManagerConfig, EmailDispatchLog } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');

const DEFAULT_CONFIG: ManagerConfig = {
  managerName: 'Operations Manager',
  managerEmail: process.env.MANAGER_EMAIL || 'Joshuaagyemang1@gmail.com',
  dailyReportTime: '18:00', // 6:00 PM evening
  weeklyReportDay: 'Sunday',
  weeklyReportTime: '19:00', // 7:00 PM Sunday evening
  autoSendDaily: true,
  autoSendWeekly: true,
  companyName: 'Apex Commercial Retail & Sales',
  currencySymbol: '$',
  smtpConfig: {
    enabled: false,
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'sales-reports@apexretail.internal'
  }
};

// Seed initial realistic sales if empty
function generateInitialSales(): Sale[] {
  const products = [
    { name: 'Ergonomic Desk Chair', price: 280 },
    { name: 'UltraWide Monitor 34"', price: 499 },
    { name: 'Mechanical Keyboard RGB', price: 129 },
    { name: 'Wireless Noise-Canceling Headset', price: 199 },
    { name: 'USB-C Universal Docking Station', price: 165 },
    { name: 'Smart LED Desk Lamp', price: 65 },
    { name: 'Aluminum Laptop Riser', price: 45 },
    { name: 'Precision Laser Mouse', price: 79 },
    { name: 'Standing Desk Converter', price: 230 },
    { name: 'Braided Cable Management Pack', price: 25 },
  ];

  const customers = [
    'Sarah Jenkins', 'Marcus Chen', 'Elena Rodriguez', 'David O\'Connor',
    'Amina Yusuf', 'Lucas Van Der Bilt', 'Priya Patel', 'James Wilson',
    'Olivia Taylor', 'Liam Henderson', 'Sophia Al-Mansoor', 'Noah Bennett'
  ];

  const paymentMethods: Sale['paymentMethod'][] = [
    'Credit Card', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment', 'Cash'
  ];

  const sales: Sale[] = [];
  const now = new Date(); // 2026-09-18
  
  // Create sales across the current week (from 4 days ago to today)
  for (let d = 4; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // 3 to 6 sales per day
    const salesCount = d === 0 ? 5 : 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < salesCount; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const hour = 9 + Math.floor(Math.random() * 9); // 9am - 6pm
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      sales.push({
        id: `sale-${Date.now()}-${d}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        time: timeStr,
        amount: prod.price * qty,
        quantity: qty,
        customerName: cust,
        productBought: prod.name,
        paymentMethod: method,
        notes: Math.random() > 0.6 ? 'Corporate account receipt requested' : undefined,
        createdAt: new Date(`${dateStr}T${timeStr}:00Z`).toISOString()
      });
    }
  }

  // Sort descending by date and time
  return sales.sort((a, b) => (b.date + (b.time || '')) > (a.date + (a.time || '')) ? 1 : -1);
}

class Store {
  private sales: Sale[] = [];
  private reports: SalesReport[] = [];
  private config: ManagerConfig = DEFAULT_CONFIG;
  private emailLogs: EmailDispatchLog[] = [];

  constructor() {
    this.loadAll();
  }

  private loadAll() {
    try {
      if (fs.existsSync(SALES_FILE)) {
        this.sales = JSON.parse(fs.readFileSync(SALES_FILE, 'utf-8'));
      } else {
        this.sales = generateInitialSales();
        this.saveSales();
      }

      if (fs.existsSync(REPORTS_FILE)) {
        this.reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
      } else {
        this.reports = [];
      }

      if (fs.existsSync(CONFIG_FILE)) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
      } else {
        this.config = DEFAULT_CONFIG;
        this.saveConfig();
      }

      if (fs.existsSync(EMAILS_FILE)) {
        this.emailLogs = JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf-8'));
      } else {
        this.emailLogs = [];
      }
    } catch (err) {
      console.error('Error loading store data:', err);
      this.sales = generateInitialSales();
      this.reports = [];
      this.config = DEFAULT_CONFIG;
      this.emailLogs = [];
    }
  }

  public getSales(): Sale[] {
    return [...this.sales];
  }

  public getSale(id: string): Sale | undefined {
    return this.sales.find(s => s.id === id);
  }

  public addSale(sale: Omit<Sale, 'id' | 'createdAt'>): Sale {
    const newSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.sales.unshift(newSale);
    this.saveSales();
    return newSale;
  }

  public updateSale(id: string, updates: Partial<Sale>): Sale | null {
    const idx = this.sales.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.sales[idx] = { ...this.sales[idx], ...updates };
    this.saveSales();
    return this.sales[idx];
  }

  public deleteSale(id: string): boolean {
    const prevLen = this.sales.length;
    this.sales = this.sales.filter(s => s.id !== id);
    if (this.sales.length !== prevLen) {
      this.saveSales();
      return true;
    }
    return false;
  }

  public resetSalesToSeed(): Sale[] {
    this.sales = generateInitialSales();
    this.saveSales();
    return this.sales;
  }

  public getReports(): SalesReport[] {
    return [...this.reports];
  }

  public getReport(id: string): SalesReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  public saveReport(report: SalesReport): SalesReport {
    const idx = this.reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      this.reports[idx] = report;
    } else {
      this.reports.unshift(report);
    }
    this.saveReportsFile();
    return report;
  }

  public getConfig(): ManagerConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ManagerConfig>): ManagerConfig {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    return this.config;
  }

  public getEmailLogs(): EmailDispatchLog[] {
    return [...this.emailLogs];
  }

  public addEmailLog(log: Omit<EmailDispatchLog, 'id' | 'timestamp'>): EmailDispatchLog {
    const newLog: EmailDispatchLog = {
      ...log,
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.emailLogs.unshift(newLog);
    this.saveEmailLogs();
    return newLog;
  }

  private saveSales() {
    try {
      fs.writeFileSync(SALES_FILE, JSON.stringify(this.sales, null, 2));
    } catch (err) {
      console.error('Error saving sales:', err);
    }
  }

  private saveReportsFile() {
    try {
      fs.writeFileSync(REPORTS_FILE, JSON.stringify(this.reports, null, 2));
    } catch (err) {
      console.error('Error saving reports:', err);
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (err) {
      console.error('Error saving config:', err);
    }
  }

  private saveEmailLogs() {
    try {
      fs.writeFileSync(EMAILS_FILE, JSON.stringify(this.emailLogs, null, 2));
    } catch (err) {
      console.error('Error saving email logs:', err);
    }
  }
}

export const store = new Store();
