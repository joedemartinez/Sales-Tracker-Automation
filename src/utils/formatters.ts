export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return new Date(dateStr).toLocaleDateString();
}

export function getPaymentMethodColor(method: string): string {
  switch (method) {
    case 'Credit Card':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Debit Card':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Mobile Payment':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Bank Transfer':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Cash':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
