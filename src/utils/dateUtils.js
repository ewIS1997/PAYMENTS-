export function formatArabicMonth(monthNumber, year) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  if (monthNumber < 0 || monthNumber > 11) return String(year);
  return `${months[monthNumber]} ${year}`;
}

export function getArabicMonthName(monthNumber) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthNumber] || '';
}

export function formatDateForDisplay(date) {
  if (!date) return '-';
  const d = date instanceof Date ? date : date.toDate?.() || date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = getArabicMonthName(d.getMonth());
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatLocalDateString(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function toDateValue(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field instanceof Date) return field;
  if (typeof field === 'string') return parseLocalDate(field);
  return null;
}
