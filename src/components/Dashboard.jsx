import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  PieChart,
  Landmark,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import {
  MONTHS_LIST,
  formatCurrency,
  formatDateBR,
  isInMonth,
  isCardPurchase,
  isInvoicePayment,
  isCashFlowExpense,
  getDueDate
} from '../utils/finance';

export default function Dashboard({
  incomes,
  expenses,
  categories,
  accounts,
  creditCards = [],
  selectedMonth,
  setSelectedMonth,
  onNavigate
}) {
  // Filtro do mês: compras no cartão contam no mês da FATURA (dia de fechamento), o resto pela data.
  const monthIncomes = incomes.filter(i => i.date && i.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => isInMonth(e, selectedMonth, creditCards));

  // Fluxo de caixa: o que sai da conta no mês. Compras no cartão entram pela linha de pagamento da fatura.
  const cashExpenses = monthExpenses.filter(isCashFlowExpense);
  const cardPurchases = monthExpenses.filter(isCardPurchase);

  // Income calculations
  const predictedIncome = monthIncomes.reduce((sum, i) => sum + (i.predicted_amount || 0), 0);
  const actualIncome = monthIncomes.reduce((sum, i) => sum + (i.actual_amount || 0), 0);

  // Expense calculations (caixa)
  const predictedExpense = cashExpenses.reduce((sum, e) => sum + (e.predicted_amount || 0), 0);
  const actualExpense = cashExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);

  // Balance
  const netBalanceActual = actualIncome - actualExpense;
  const netBalancePredicted = predictedIncome - predictedExpense;

  // Reservas (contas tipo 'reserva'): saldo acumulado, sem filtro de mês
  const reserveAccounts = accounts.filter(a => a.type === 'reserva');
  const movementAccounts = accounts.filter(a => a.type !== 'reserva');
  const getReserveBalance = (acc) =>
    (acc.initial_balance || 0)
    + incomes.filter(i => i.account_id === acc.id).reduce((s, i) => s + (i.actual_amount || 0), 0)
    - expenses.filter(e => e.account_id === acc.id && isCashFlowExpense(e)).reduce((s, e) => s + (e.actual_amount || 0), 0);
  const totalReserves = reserveAccounts.reduce((s, a) => s + getReserveBalance(a), 0);

  // Termômetro por categoria: inclui compras no cartão (pela categoria) e as linhas de fatura em "Cartões"
  const categoryStats = categories.map(cat => {
    const catExpenses = monthExpenses.filter(e => e.category_id === cat.id);
    const spent = catExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
    const limit = cat.monthly_limit || 0;
    const rawPct = limit > 0 ? (spent / limit) * 100 : 0;

    let status = 'normal';
    if (rawPct > 100) status = 'exceeded';
    else if (rawPct >= 80) status = 'warning';

    return {
      ...cat,
      spent,
      limit,
      expenseCount: catExpenses.length,
      percentage: Math.min(rawPct, 100),
      rawPct,
      status
    };
  });

  const alerts = categoryStats.filter(c => c.status === 'exceeded' || c.status === 'warning');

  // Cartões: compras da fatura do mês + situação da linha de pagamento da fatura
  const cardStats = creditCards.map(card => {
    const purchases = cardPurchases.filter(e => e.card_id === card.id);
    const spent = purchases.reduce((sum, e) => sum + (e.actual_amount || e.predicted_amount || 0), 0);
    const invoiceLine = cashExpenses.find(e => isInvoicePayment(e) && e.card_id === card.id);
    const limit = card.limit_amount || 0;
    const rawPct = limit > 0 ? (spent / limit) * 100 : 0;

    let status = 'normal';
    if (rawPct > 100) status = 'exceeded';
    else if (rawPct >= 80) status = 'warning';

    let paymentStatus = 'missing';
    if (invoiceLine && invoiceLine.status === 'ok') paymentStatus = 'paid';
    else if (invoiceLine) paymentStatus = 'pending';

    return {
      ...card,
      spent,
      limit,
      invoiceLine,
      purchasesCount: purchases.length,
      paymentStatus,
      dueDate: getDueDate(selectedMonth, card.due_day),
      percentage: Math.min(rawPct, 100),
      rawPct,
      status
    };
  });

  const invoicesWithActivity = cardStats.filter(c => c.purchasesCount > 0 || c.invoiceLine);

  return (
    <div className="dashboard-container">
      {/* Top Header & Month Filter */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-title">Dashboard Financeiro</h1>
          <p className="dashboard-subtitle">Visão consolidada de entradas, saídas e termômetros de orçamento</p>
        </div>

        <div className="month-picker-container">
          <Calendar size={18} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-picker-select"
          >
            {MONTHS_LIST.map(m => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card kpi-income">
          <div className="kpi-header">
            <span className="kpi-title">Total Receitas ({selectedMonth})</span>
            <div className="kpi-icon-badge icon-income"><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-value text-income">{formatCurrency(actualIncome)}</div>
          <div className="kpi-subtext">
            <span>Previsão: {formatCurrency(predictedIncome)}</span>
          </div>
        </div>

        <div className="kpi-card kpi-expense">
          <div className="kpi-header">
            <span className="kpi-title">Total Despesas ({selectedMonth})</span>
            <div className="kpi-icon-badge icon-expense"><TrendingDown size={20} /></div>
          </div>
          <div className="kpi-value text-expense">{formatCurrency(actualExpense)}</div>
          <div className="kpi-subtext">
            <span>Previsão: {formatCurrency(predictedExpense)}</span>
          </div>
        </div>

        <div className="kpi-card kpi-balance">
          <div className="kpi-header">
            <span className="kpi-title">Saldo Realizado</span>
            <div className="kpi-icon-badge icon-balance"><Wallet size={20} /></div>
          </div>
          <div className={`kpi-value ${netBalanceActual >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(netBalanceActual)}
          </div>
          <div className="kpi-subtext">
            <span>Saldo Previsto: {formatCurrency(netBalancePredicted)}</span>
          </div>
        </div>

        {reserveAccounts.length > 0 && (
          <div className="kpi-card kpi-balance">
            <div className="kpi-header">
              <span className="kpi-title">Reservas</span>
              <div className="kpi-icon-badge icon-balance"><ShieldCheck size={20} /></div>
            </div>
            <div className="kpi-value text-income">{formatCurrency(totalReserves)}</div>
            <div className="kpi-subtext">
              <span>{reserveAccounts.map(a => `${a.name}: ${formatCurrency(getReserveBalance(a))}`).join(' • ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Faturas de cartão do mês */}
      {invoicesWithActivity.length > 0 && (
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div>
              <h2>Faturas de Cartão em {selectedMonth}</h2>
              <p>Compras que caem na fatura deste mês (pelo dia de fechamento) e situação do pagamento</p>
            </div>
            <button className="btn btn-outline" onClick={() => onNavigate('cartoes')}>
              <span>Ver Cartões</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="accounts-summary-row">
            {invoicesWithActivity.map(card => (
              <div key={card.id} className="account-mini-card" style={{ borderLeft: `4px solid ${card.color || '#3b82f6'}` }}>
                <div className="mini-card-header">
                  <CreditCard size={18} className="text-secondary" />
                  <span className="font-semibold">{card.name}</span>
                </div>
                <div className="mini-card-balance text-expense">{formatCurrency(card.spent)}</div>
                <div className="mini-card-details" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <span className="text-xs text-secondary">
                    {card.purchasesCount} compra{card.purchasesCount !== 1 ? 's' : ''} • vence {formatDateBR(card.dueDate)}
                  </span>
                  {card.paymentStatus === 'paid' && (
                    <span className="badge badge-success">Fatura paga: {formatCurrency(card.invoiceLine.actual_amount)}</span>
                  )}
                  {card.paymentStatus === 'pending' && (
                    <span className="badge badge-warning">Pagamento previsto: {formatCurrency(card.invoiceLine.predicted_amount)}</span>
                  )}
                  {card.paymentStatus === 'missing' && (
                    <span className="badge badge-danger">Pagamento da fatura não lançado</span>
                  )}
                  {card.status !== 'normal' && (
                    <span className="text-xs text-expense">{card.rawPct.toFixed(0)}% do limite de {formatCurrency(card.limit)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Limit Alerts Banner */}
      {alerts.length > 0 && (
        <div className="alerts-callout-banner">
          <div className="alerts-callout-header">
            <AlertTriangle size={22} className="text-warning" />
            <div>
              <h3>Avisos de Atenção de Limites ({alerts.length})</h3>
              <p>Categorias que atingiram 80% ou ultrapassaram a previsão mensal em {selectedMonth}:</p>
            </div>
          </div>
          <div className="alerts-list">
            {alerts.map(item => (
              <div key={item.id} className={`alert-item-pill ${item.status === 'exceeded' ? 'pill-danger' : 'pill-warning'}`}>
                <span className="font-semibold">{item.name}:</span>
                <span>{formatCurrency(item.spent)} de {formatCurrency(item.limit)} ({item.rawPct.toFixed(0)}%)</span>
                {item.status === 'exceeded' ? (
                  <span className="badge badge-danger">Ultrpassou Limite</span>
                ) : (
                  <span className="badge badge-warning">Atenção (80%+)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thermometers Grid */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h2>Termômetro de Categorias & Orçamento</h2>
            <p>Acompanhamento visual da barra de progresso de cada categoria</p>
          </div>
          <button className="btn btn-outline" onClick={() => onNavigate('categorias')}>
            <span>Gerenciar Limites</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="thermometer-grid-dashboard">
          {categoryStats.map(cat => {
            let progressClass = 'progress-normal';
            if (cat.status === 'exceeded') progressClass = 'progress-danger';
            else if (cat.status === 'warning') progressClass = 'progress-warning';

            return (
              <div key={cat.id} className="dash-thermometer-item">
                <div className="dash-thermo-top">
                  <div className="dash-thermo-title">
                    <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatCurrency(cat.spent)} / {formatCurrency(cat.limit)}
                  </span>
                </div>

                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${progressClass}`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>

                <div className="dash-thermo-footer">
                  <span className="text-xs text-secondary">
                    {cat.rawPct.toFixed(0)}% ({cat.expenseCount} despesa{cat.expenseCount !== 1 ? 's' : ''})
                  </span>
                  {cat.status === 'exceeded' && (
                    <span className="text-xs text-expense font-bold">⚠️ Acima do Limite</span>
                  )}
                  {cat.status === 'warning' && (
                    <span className="text-xs text-warning font-semibold">⚠️ 80%+ do Limite</span>
                  )}
                  {cat.status === 'normal' && (
                    <span className="text-xs text-income font-medium">✓ Dentro da Previsão</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accounts Breakdown Bar */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h2>Consolidação por Contas Bancárias</h2>
            <p>Entradas e saídas separadas por Carteira e Contas Correntes</p>
          </div>
          <button className="btn btn-outline" onClick={() => onNavigate('contas')}>
            <span>Ver Contas</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="accounts-summary-row">
          {movementAccounts.map(acc => {
            const accIncomes = monthIncomes.filter(i => i.account_id === acc.id).reduce((s, i) => s + (i.actual_amount || 0), 0);
            const accExpenses = cashExpenses.filter(e => e.account_id === acc.id).reduce((s, e) => s + (e.actual_amount || 0), 0);
            const balance = (acc.initial_balance || 0) + accIncomes - accExpenses;

            return (
              <div key={acc.id} className="account-mini-card">
                <div className="mini-card-header">
                  <Landmark size={18} className="text-secondary" />
                  <span className="font-semibold">{acc.name}</span>
                </div>
                <div className={`mini-card-balance ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(balance)}
                </div>
                <div className="mini-card-details">
                  <span className="text-income">+ {formatCurrency(accIncomes)}</span>
                  <span className="text-expense">- {formatCurrency(accExpenses)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
