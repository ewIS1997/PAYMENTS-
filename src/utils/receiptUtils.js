export function formatReceiptNumber(prefix, year, sequence) {
  const paddedSequence = String(sequence).padStart(5, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}
