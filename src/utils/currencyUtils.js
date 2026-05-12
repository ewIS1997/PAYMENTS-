export function formatCurrency(amount) {
  if (amount == null || amount === '') return '0 جنيه';
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه`;
}
