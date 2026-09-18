import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  RotateCcw,
  Receipt
} from 'lucide-react';
import { Sale, PaymentMethod } from '../types';
import { formatCurrency, getPaymentMethodColor } from '../utils/formatters';

interface SalesLedgerViewProps {
  sales: Sale[];
  onOpenRecordSale: () => void;
  onDeleteSale: (id: string) => void;
  onResetSeedData: () => void;
  currencySymbol: string;
}

export const SalesLedgerView: React.FC<SalesLedgerViewProps> = ({
  sales,
  onOpenRecordSale,
  onDeleteSale,
  onResetSeedData,
  currencySymbol,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering
  const filteredSales = sales.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCustomer = s.customerName.toLowerCase().includes(q);
      const matchProduct = s.productBought.toLowerCase().includes(q);
      const matchNotes = s.notes ? s.notes.toLowerCase().includes(q) : false;
      if (!matchCustomer && !matchProduct && !matchNotes) return false;
    }

    if (selectedMethod !== 'all' && s.paymentMethod !== selectedMethod) {
      return false;
    }

    if (startDate && s.date < startDate) {
      return false;
    }

    if (endDate && s.date > endDate) {
      return false;
    }

    return true;
  });

  const totalFilteredAmount = filteredSales.reduce((acc, s) => acc + s.amount, 0);
  const totalFilteredQty = filteredSales.reduce((acc, s) => acc + s.quantity, 0);

  const exportCsv = () => {
    const headers = ['Date', 'Time', 'Customer Name', 'Product Bought', 'Quantity', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredSales.map(s => [
      s.date,
      s.time || '',
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.productBought.replace(/"/g, '""')}"`,
      s.quantity,
      s.amount.toFixed(2),
      s.paymentMethod,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span>Full Sales Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized historical register feeding automatic evening summary generation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onResetSeedData}
              title="Reset sales with realistic sample data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reload Sample Data</span>
            </button>

            <button
              onClick={onOpenRecordSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Method filter */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
            >
              <option value="all">All Payment Gateways</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Mobile Payment">Mobile Payment</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 shrink-0">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 shrink-0">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Aggregate counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <strong className="text-slate-800 font-semibold">{filteredSales.length}</strong> of{' '}
            {sales.length} transactions
          </div>
          <div>
            Filtered Total: <strong className="text-blue-700 font-bold">{formatCurrency(totalFilteredAmount, currencySymbol)}</strong>{' '}
            ({totalFilteredQty} units)
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Bought</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales records found matching the active criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      <div>{sale.date}</div>
                      <div className="text-[11px] text-slate-400">{sale.time || '12:00'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{sale.customerName}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {sale.productBought}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-center font-semibold text-slate-700">
                      {sale.quantity}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-slate-900">
                      {formatCurrency(sale.amount, currencySymbol)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${getPaymentMethodColor(sale.paymentMethod)}`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                      {sale.notes || '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete sale #${sale.id} for ${sale.customerName}?`)) {
                            onDeleteSale(sale.id);
                          }
                        }}
                        title="Delete record"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
