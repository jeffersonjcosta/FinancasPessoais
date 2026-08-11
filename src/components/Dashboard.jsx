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
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({
  incomes,
  expenses,
  categories,
  accounts,
  selectedMonth,
  setSelectedMonth,
  onNavigate
}) {
  const MONTHS_LIST = [
    { code: '2026-01', name: 'Janeiro 2026' },
    { code: '2026-02', name: 'Fevereiro 2026' },
    { code: '2026-03', name: 'Março 2026' },
    { code: '2026-04', name: 'Abril 2026' },
    { code: '2026-05', name: 'Maio 2026' },
    { code: '2026-06', name: 'Junho 2026' },
    { code: '2026-07', name: 'Julho 2026' },
    { code: '2026-08', name: 'Agosto 2026' },
    { code: '2026-09', name: 'Setembro 2026' },
    { code: '2026-10', name: 'Outubro 2026' },
    { code: '2026-11', name: 'Novembro 2026' },
    { code: '2026-12', name: 'Dezembro 2026' },
  ];

  // Filter for selected month
  const monthIncomes = incomes.filter(i => i.date && i.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(selectedMonth));

  // Income calculations
  const predictedIncome = monthIncomes.reduce((sum, i) => sum + (i.predicted_amount || 0), 0);
  const actualIncome = monthIncomes.reduce((sum, i) => sum + (i.actual_amount || 0), 0);

  // Expense calculations
  const predictedExpense = monthExpenses.reduce((sum, e) => sum + (e.predicted_amount || 0), 0);
  const actualExpense = monthExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);

  // Balance
  const netBalanceActual = actualIncome - actualExpense;
  const netBalancePredicted = predictedIncome - predictedExpense;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Category thermometer & warning alerts calculation
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
      </div>

      {/* Limit Alerts Banner */}
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
          {accounts.map(acc => {
            const accIncomes = monthIncomes.filter(i => i.account_id === acc.id).reduce((s, i) => s + (i.actual_amount || 0), 0);
            const accExpenses = monthExpenses.filter(e => e.account_id === acc.id).reduce((s, e) => s + (e.actual_amount || 0), 0);
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
