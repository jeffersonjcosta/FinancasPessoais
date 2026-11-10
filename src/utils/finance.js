// Regras financeiras compartilhadas (Dashboard, Despesas, Cartões, Contas).
//
// Conceitos:
// - Compra no cartão: despesa com card_id. Cai na FATURA do mês definido pelo dia de fechamento
//   do cartão (compra depois do fechamento vai para a fatura do mês seguinte).
// - Pagamento de fatura: despesa de caixa (sai da conta) com is_invoice_payment=true ou categoria
//   'cat-cartoes'. Representa as compras do cartão no fluxo de caixa, evitando dupla contagem.
// - Fluxo de caixa do mês = todas as despesas do mês, exceto compras no cartão.

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthName = (code) => {
  const [y, m] = code.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

// De janeiro/2026 até 12 meses à frente do mês atual (cobre parcelas futuras).
export const MONTHS_LIST = (() => {
  const list = [];
  const [cy, cm] = currentMonth().split('-').map(Number);
  const endIndex = cy * 12 + (cm - 1) + 12;
  for (let i = 2026 * 12; i <= endIndex; i++) {
    const code = `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
    list.push({ code, name: monthName(code) });
  }
  return list;
})();

export const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const pad2 = (n) => String(n).padStart(2, '0');

export const formatDateBR = (iso) =>
  iso && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';

// Soma n meses a uma data ISO (YYYY-MM-DD), mantendo o dia quando possível.
export const addMonths = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const total = (m - 1) + n;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12 + 1;
  const lastDay = new Date(ny, nm, 0).getDate();
  return `${ny}-${pad2(nm)}-${pad2(Math.min(d || 1, lastDay))}`;
};

export const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

// Mês (YYYY-MM) da fatura em que uma compra cai, dado o dia de fechamento do cartão.
export const getInvoiceMonth = (dateStr, closingDay) => {
  if (!dateStr || dateStr.length < 7) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const cd = parseInt(closingDay, 10);
  if (!cd || !d || d <= cd) return `${y}-${pad2(m)}`;
  return addMonths(`${y}-${pad2(m)}-01`, 1).slice(0, 7);
};

export const isInvoicePayment = (exp) =>
  Boolean(exp && (exp.is_invoice_payment === true || exp.category_id === 'cat-cartoes'));

export const isCardPurchase = (exp) =>
  Boolean(exp && exp.card_id && !isInvoicePayment(exp));

export const isCashFlowExpense = (exp) => !isCardPurchase(exp);

// Mês em que a despesa "conta": compra no cartão -> mês da fatura; demais -> mês da data.
export const getEffectiveMonth = (exp, creditCards = []) => {
  if (!exp || !exp.date) return '';
  if (isCardPurchase(exp)) {
    const card = creditCards.find(c => c.id === exp.card_id);
    return getInvoiceMonth(exp.date, card ? card.closing_day : null);
  }
  return exp.date.slice(0, 7);
};

export const isInMonth = (exp, month, creditCards) => getEffectiveMonth(exp, creditCards) === month;

// Data de vencimento (ISO) da fatura de um mês, limitada ao último dia do mês.
export const getDueDate = (month, dueDay) => {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${month}-${pad2(Math.min(parseInt(dueDay, 10) || 1, lastDay))}`;
};

// Período de compras coberto pela fatura do mês: (fechamento anterior + 1) até o fechamento.
export const getInvoicePeriod = (month, closingDay) => {
  const cd = parseInt(closingDay, 10) || 31;
  const end = getDueDate(month, cd);
  const prevMonth = addMonths(`${month}-01`, -1).slice(0, 7);
  const start = addDays(getDueDate(prevMonth, cd), 1);
  return { start, end, startBR: formatDateBR(start), endBR: formatDateBR(end) };
};
