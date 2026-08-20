export const getJakartaDateKey = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const shouldAutoCloseShift = (shift, sessionDateKey) => {
  if (!shift || !sessionDateKey) return false;
  const shiftDateKey = getJakartaDateKey(shift.startTime || shift.createdAt);
  return Boolean(shiftDateKey && shiftDateKey < sessionDateKey);
};

export const getShiftCashSummary = (shift, transactions = [], expenses = []) => {
  const startedAt = new Date(shift?.startTime || shift?.createdAt || 0).getTime();
  const validTransactions = transactions.filter(transaction => {
    const transactionTime = new Date(transaction.date || transaction.createdAt || 0).getTime();
    const status = String(transaction.status || transaction.paymentStatus || '').toLowerCase();
    return Number.isFinite(transactionTime) && transactionTime >= startedAt && status !== 'void';
  });
  const cashSales = validTransactions
    .filter(transaction => String(transaction.paymentMethod || '').toLowerCase() === 'cash')
    .reduce((sum, transaction) => sum + (Number(transaction.total) || 0), 0);
  const cashExpenses = expenses
    .filter(expense => {
      const expenseTime = new Date(expense.createdAt || expense.date || 0).getTime();
      return Number.isFinite(expenseTime) && expenseTime >= startedAt
        && String(expense.paymentMethod || '').toLowerCase() === 'cash';
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  return {
    validTransactions,
    cashSales,
    cashExpenses,
    expectedCash: (Number(shift?.openingCash) || 0) + cashSales - cashExpenses
  };
};
