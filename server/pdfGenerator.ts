import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesReport, ManagerConfig } from '../src/types';

export function generatePdfBuffer(report: SalesReport, config: ManagerConfig): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = config.currencySymbol || '$';
  const isDaily = report.type === 'daily';
  const primaryColor = isDaily ? [30, 64, 175] : [15, 118, 110]; // Blue for daily, Teal for weekly
  const accentColor = [241, 245, 249]; // Slate 100

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleText = isDaily 
    ? 'DAILY SALES SUMMARY REPORT' 
    : 'END-OF-WEEK SALES SUMMARY REPORT';
  doc.text(titleText, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${config.companyName}  |  Automated Executive Dispatch`, 14, 21);

  // Report Period & Metadata
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 196, 14, { align: 'right' });
  doc.text(`Period: ${report.periodLabel}`, 196, 21, { align: 'right' });

  // Key KPI Cards (4 columns)
  let yPos = 36;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EXECUTIVE PERFORMANCE HIGHLIGHTS', 14, yPos);
  yPos += 4;

  const cardWidth = 43;
  const cardHeight = 22;
  const gap = 4.5;
  const startX = 14;

  const kpis = [
    { label: 'TOTAL REVENUE', value: `${currency}${report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'TRANSACTIONS', value: `${report.totalTransactions} orders` },
    { label: 'UNITS SOLD', value: `${report.totalUnitsSold} units` },
    { label: 'AVG ORDER VALUE', value: `${currency}${report.averageOrderValue.toFixed(2)}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + gap);
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, yPos + 7);

    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 4, yPos + 16);
  });

  yPos += cardHeight + 8;

  // Breakdown by Product & Payment Method
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. Product Performance Breakdown', 14, yPos);

  const productRows = report.productBreakdown.map(p => [
    p.product,
    p.units.toString(),
    `${currency}${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${p.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Product Description', 'Units Sold', 'Total Revenue', '% Share']],
    body: productRows.length > 0 ? productRows : [['No sales recorded for this period', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  yPos = doc.lastAutoTable.finalY + 8;

  // Payment Method Breakdown
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Payment Method Distribution', 14, yPos);

  const paymentRows = report.paymentBreakdown.map(p => [
    p.method,
    p.count.toString(),
    `${currency}${p.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${p.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Payment Method', 'Transactions', 'Gross Collected', '% Distribution']],
    body: paymentRows.length > 0 ? paymentRows : [['No transactions recorded', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  yPos = doc.lastAutoTable.finalY + 8;

  // If yPos is too close to bottom, add page for Itemized Transactions
  if (yPos > 210) {
    doc.addPage();
    yPos = 20;
  }

  // 3. Itemized Sales Ledger
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. Itemized Sales Records', 14, yPos);

  const salesRows = report.salesList.slice(0, 40).map(s => [
    s.date + (s.time ? ` ${s.time}` : ''),
    s.customerName,
    s.productBought,
    s.quantity.toString(),
    `${currency}${s.amount.toFixed(2)}`,
    s.paymentMethod
  ]);

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Date / Time', 'Customer Name', 'Product Bought', 'Qty', 'Amount', 'Payment Method']],
    body: salesRows.length > 0 ? salesRows : [['No sales recorded for this period', '', '', '', '', '']],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 38 },
      2: { cellWidth: 48 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 24 },
      5: { cellWidth: 30 }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer / Verification Notice
  // @ts-expect-error autoTable adds lastAutoTable to doc
  yPos = doc.lastAutoTable.finalY + 10;
  if (yPos > 265) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, yPos, 196, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Manager: ${config.managerName} (${config.managerEmail}) | Automatically compiled by Sales Tracker System.`,
    14,
    yPos
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}  •  Report ID: ${report.id}`, 196, 290, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
