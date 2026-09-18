import React, { useState } from 'react';
import { X, DollarSign, User, Package, Calendar, Clock, CreditCard, Tag } from 'lucide-react';
import { PaymentMethod, Sale } from '../types';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: (sale: Sale) => void;
}

const COMMON_PRODUCTS = [
  { name: 'Ergonomic Desk Chair', price: 280 },
  { name: 'UltraWide Monitor 34"', price: 499 },
  { name: 'Mechanical Keyboard RGB', price: 129 },
  { name: 'Wireless Headset Pro', price: 199 },
  { name: 'USB-C Docking Station', price: 165 },
  { name: 'Standing Desk Converter', price: 230 },
  { name: 'Precision Laser Mouse', price: 79 },
  { name: 'Smart LED Desk Lamp', price: 65 }
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Mobile Payment',
  'Cash'
];

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleCreated,
}) => {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [amount, setAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [productBought, setProductBought] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSuggestedProduct = (prod: { name: string; price: number }) => {
    setProductBought(prod.name);
    setAmount((prod.price * (quantity || 1)).toFixed(2));
  };

  const handleQuantityChange = (newQty: number) => {
    const q = Math.max(1, newQty);
    setQuantity(q);
    // If a common product was picked, scale amount
    const matched = COMMON_PRODUCTS.find(p => p.name === productBought);
    if (matched) {
      setAmount((matched.price * q).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid sale amount greater than 0.');
      return;
    }

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (!productBought.trim()) {
      setError('Product bought is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          amount: numAmount,
          quantity: Number(quantity) || 1,
          customerName: customerName.trim(),
          productBought: productBought.trim(),
          paymentMethod,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record sale');
      }

      const data = await res.json();
      onSaleCreated(data.sale);
      onClose();
      // Reset
      setAmount('');
      setCustomerName('');
      setProductBought('');
      setNotes('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record New Sale</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input transaction parameters to reflect instantly across live analytics & evening reports.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date
              </label>
              <input
                id="input-sale-date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time
              </label>
              <input
                id="input-sale-time"
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Customer Name
            </label>
            <input
              id="input-sale-customer"
              type="text"
              required
              placeholder="e.g. Sarah Jenkins or TechCorp Logistics"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Product Bought */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                Product Bought
              </label>
              <span className="text-[11px] text-slate-400">Quick-select popular product:</span>
            </div>
            <input
              id="input-sale-product"
              type="text"
              required
              placeholder="e.g. Ergonomic Desk Chair"
              value={productBought}
              onChange={e => setProductBought(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
              {COMMON_PRODUCTS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectSuggestedProduct(p)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors flex items-center gap-1 ${
                    productBought === p.name
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{p.name}</span>
                  <span className="text-slate-400 font-normal">(${p.price})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity
              </label>
              <input
                id="input-sale-quantity"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Total Amount ($)
              </label>
              <input
                id="input-sale-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    paymentMethod === method
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              id="input-sale-notes"
              type="text"
              placeholder="e.g. Corporate PO #4819, discount applied"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-sale"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm & Record Sale</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
