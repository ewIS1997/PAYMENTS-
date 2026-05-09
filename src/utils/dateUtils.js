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
  const day = date.getDate();
  const month = getArabicMonthName(date.getMonth());
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function toDateValue(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field instanceof Date) return field;
  return null;
}
