export function formatArabicMonth(monthNumber, year) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
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

export function toDateValue(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field instanceof Date) return field;
  return null;
}
