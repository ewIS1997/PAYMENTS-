export function generateInstallments(contractId, customerId, startDate, totalAmount, monthlyAmount, monthsCount) {
  const installments = [];
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  for (let i = 0; i < monthsCount; i++) {
    const dueDate = new Date(currentDate);

    let amount;
    if (i === monthsCount - 1) {
      const paidSoFar = monthlyAmount * i;
      amount = Math.round((totalAmount - paidSoFar) * 100) / 100;
    } else {
      amount = monthlyAmount;
    }

    installments.push({
      contract_id: contractId,
      customer_id: customerId,
      due_date: dueDate,
      amount: amount,
      status: 'pending',
      payment_date: null,
      receipt_id: null,
    });

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return installments;
}

export function calculateEndDate(startDate, monthsCount) {
  return new Date(startDate.getFullYear(), startDate.getMonth() + monthsCount - 1, 1);
}
