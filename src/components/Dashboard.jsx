import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, PlusCircle, Coffee, ShoppingBag, Car, Utensils, CreditCard, Landmark, BellRing } from 'lucide-react';

export default function Dashboard({
  profile,
  transactions = [],
  onAddTransaction,
  customCategories = [],
  creditCards = [],
  debts = []
}) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('lifestyle');
  const [subCategory, setSubCategory] = useState('');
  const [cardId, setCardId] = useState('');
  const [type, setType] = useState('expense');
  const [submitting, setSubmitting] = useState(false);

  // Time calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Filter current month transactions
  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Macro categories spend calculations
  const spentEssentials = currentMonthTxs
    .filter(t => t.type === 'expense' && t.category === 'essentials')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const spentLifestyle = currentMonthTxs
    .filter(t => t.type === 'expense' && t.category === 'lifestyle')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const spentSavings = currentMonthTxs
    .filter(t => t.type === 'expense' && t.category === 'savings')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const limitLifestyle = Number(profile?.limit_lifestyle || 2500);
  const remainingLifestyle = limitLifestyle - spentLifestyle;
  
  const safeDailySpend = daysRemaining > 0 && remainingLifestyle > 0 
    ? remainingLifestyle / daysRemaining 
    : 0;

  const actualDailySpend = currentDay > 0 ? spentLifestyle / currentDay : 0;

  // Semáforo Traffic Light Status
  let status = 'green';
  let statusTitle = 'ZONA SEGURA';
  let statusMessage = `Você tem R$ ${safeDailySpend.toFixed(2)} por dia disponíveis para os próximos ${daysRemaining} dias.`;

  if (limitLifestyle > 0) {
    if (remainingLifestyle <= 0 || actualDailySpend > safeDailySpend * 1.15) {
      status = 'red';
      statusTitle = 'FREIO DE MÃO!';
      statusMessage = remainingLifestyle <= 0
        ? `Você estourou o orçamento de Estilo de Vida por R$ ${Math.abs(remainingLifestyle).toFixed(2)}. Pare gastos não essenciais!`
        : `Sua média diária (R$ ${actualDailySpend.toFixed(2)}) ultrapassa a velocidade segura (R$ ${safeDailySpend.toFixed(2)}). Reduza o ritmo!`;
    } else if (actualDailySpend > safeDailySpend || (spentLifestyle >= limitLifestyle * 0.75)) {
      status = 'yellow';
      statusTitle = 'ATENÇÃO AO RITMO';
      statusMessage = `Seus gastos flexíveis atingiram ${(spentLifestyle / limitLifestyle * 100).toFixed(0)}% do limite. Economize nos próximos dias!`;
    }
  }

  // Calculate Spend by Subcategory for Category Threshold Warnings
  const categoryBudgets = [
    { name: 'Alimentação / Mercado', limit: 2500, macro: 'essentials' },
    { name: 'Transporte / Gasolina', limit: 600, macro: 'essentials' },
    { name: 'Restaurante / Delivery', limit: 400, macro: 'lifestyle' },
    { name: 'Lazer & Lanches', limit: 400, macro: 'lifestyle' },
    { name: 'Compras & Roupas', limit: 500, macro: 'lifestyle' },
    ...customCategories.map(c => ({ name: c.name, limit: Number(c.budget_limit || 0), macro: c.macro_category }))
  ];

  const categoryWarnings = [];

  categoryBudgets.forEach(cat => {
    if (cat.limit <= 0) return;

    const catSpend = currentMonthTxs
      .filter(t => t.type === 'expense' && (t.sub_category === cat.name || t.description.toLowerCase().includes(cat.name.toLowerCase())))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const ratio = catSpend / cat.limit;

    if (ratio >= 1.0) {
      categoryWarnings.push({
        name: cat.name,
        spend: catSpend,
        limit: cat.limit,
        ratio: ratio,
        type: 'danger',
        message: `Ultrapassou o teto em R$ ${(catSpend - cat.limit).toFixed(2)}!`
      });
    } else if (ratio >= 0.75) {
      categoryWarnings.push({
        name: cat.name,
        spend: catSpend,
        limit: cat.limit,
        ratio: ratio,
        type: 'warning',
        message: `Atingiu ${(ratio * 100).toFixed(0)}% do limite planejado.`
      });
    }
  });

  const handleQuickPreset = (presetDesc, presetAmount, presetCategory, presetSub = '') => {
    setDesc(presetDesc);
    setAmount(presetAmount.toString());
    setCategory(presetCategory);
    setSubCategory(presetSub || presetDesc);
    setType('expense');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setSubmitting(true);
    await onAddTransaction({
      description: desc || (subCategory ? subCategory : type === 'income' ? 'Receita' : 'Gasto Rápido'),
      amount: Number(amount),
      category,
      sub_category: subCategory || desc || 'Geral',
      card_id: cardId || null,
      type,
      date: new Date().toISOString().split('T')[0]
    });

    setDesc('');
    setAmount('');
    setSubCategory('');
    setSubmitting(false);
  };

  const filteredSubCats = customCategories.filter(c => c.macro_category === category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Desktop Grid Layout (2 columns) */}
      <div className="dashboard-grid">
        
        {/* Left Column: Semáforo & Quick Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Traffic Light Card */}
          <div className={`glass-card traffic-card ${status}`}>
            <div className="traffic-header">
              <div className="traffic-indicator">
                <span className={`status-dot ${status}`}></span>
                <span>{statusTitle}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {daysRemaining} dias restantes no mês
              </span>
            </div>

            <div className="traffic-body">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Teto Diário Seguro de Gastos Flexíveis</div>
              <div className="daily-limit-value" style={{ color: status === 'red' ? 'var(--color-red)' : status === 'yellow' ? 'var(--color-yellow)' : 'var(--color-green)' }}>
                R$ {safeDailySpend.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ dia</span>
              </div>

              <div className={`traffic-message ${status}`}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  {status === 'red' && <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {status === 'yellow' && <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {status === 'green' && <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <div>{statusMessage}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add Form */}
          <div className="glass-card quick-add-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">Lançamento Rápido de Gastos</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`pill-btn ${type === 'expense' ? 'active lifestyle' : ''}`}
                  onClick={() => setType('expense')}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  className={`pill-btn ${type === 'income' ? 'active savings' : ''}`}
                  onClick={() => setType('income')}
                >
                  Receita
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="preset-buttons">
              <button type="button" className="preset-btn" onClick={() => handleQuickPreset('Café', 5, 'lifestyle', 'Café / Lanche')}>
                <Coffee size={15} /> Café R$ 5
              </button>
              <button type="button" className="preset-btn" onClick={() => handleQuickPreset('Almoço', 35, 'lifestyle', 'Restaurante / Delivery')}>
                <Utensils size={15} /> Almoço R$ 35
              </button>
              <button type="button" className="preset-btn" onClick={() => handleQuickPreset('Mercado', 100, 'essentials', 'Alimentação / Mercado')}>
                <ShoppingBag size={15} /> Mercado R$ 100
              </button>
              <button type="button" className="preset-btn" onClick={() => handleQuickPreset('Gasolina', 150, 'essentials', 'Transporte / Gasolina')}>
                <Car size={15} /> Gasolina R$ 150
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="quick-inputs">
                <input
                  type="number"
                  step="0.01"
                  className="input-glass"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontWeight: 700, fontSize: '1.25rem' }}
                />
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Descrição (ex: Bramil, Padaria)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="category-pills">
                <button
                  type="button"
                  className={`pill-btn ${category === 'essentials' ? 'active essentials' : ''}`}
                  onClick={() => setCategory('essentials')}
                >
                  Essencial
                </button>
                <button
                  type="button"
                  className={`pill-btn ${category === 'lifestyle' ? 'active lifestyle' : ''}`}
                  onClick={() => setCategory('lifestyle')}
                >
                  Estilo de Vida
                </button>
                <button
                  type="button"
                  className={`pill-btn ${category === 'savings' ? 'active savings' : ''}`}
                  onClick={() => setCategory('savings')}
                >
                  Futuro / Poupança
                </button>
              </div>

              <div className="quick-inputs">
                {filteredSubCats.length > 0 && (
                  <select
                    className="input-glass"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    <option value="">Selecione Subcategoria...</option>
                    {filteredSubCats.map(sc => (
                      <option key={sc.id} value={sc.name}>{sc.name}</option>
                    ))}
                  </select>
                )}

                {creditCards.length > 0 && (
                  <select
                    className="input-glass"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  >
                    <option value="">Forma: Pix / Conta</option>
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>Cartão: {card.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                <PlusCircle size={18} /> {submitting ? 'Salvando...' : 'Salvar Gasto'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Category Warnings & Budget Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Category Warnings Section */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <BellRing size={18} style={{ color: 'var(--color-yellow)' }} />
                Avisos de Categorias Próximas do Limite
              </div>
              <span className="alert-badge warning">{categoryWarnings.length} Alerta(s)</span>
            </div>

            {categoryWarnings.length === 0 ? (
              <div className="traffic-message green" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} /> Nenhuma categoria ultrapassou 75% do teto planejado. Parabéns!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {categoryWarnings.map((warn, i) => (
                  <div key={i} className={`category-alert-card ${warn.type}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`alert-badge ${warn.type}`}>
                        {warn.type === 'danger' ? 'Excedido' : 'Próximo do Teto'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        R$ {warn.spend.toFixed(2)} / R$ {warn.limit.toFixed(2)}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{warn.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{warn.message}</div>

                    <div className="progress-bar-bg" style={{ height: '6px', marginTop: '0.2rem' }}>
                      <div
                        className={`progress-bar-fill ${warn.type === 'danger' ? 'lifestyle exceeded' : 'lifestyle'}`}
                        style={{ width: `${Math.min(100, warn.ratio * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Macro Budget Summaries */}
          <div className="glass-card budget-progress-group">
            <div className="section-title">Resumo Orçamentário do Mês</div>

            {/* Estilo de Vida */}
            <div>
              <div className="progress-header">
                <span>Estilo de Vida (Flexíveis)</span>
                <span>R$ {spentLifestyle.toFixed(2)} / R$ {limitLifestyle.toFixed(2)}</span>
              </div>
              <div className="progress-bar-bg" style={{ marginTop: '0.35rem' }}>
                <div
                  className={`progress-bar-fill lifestyle ${spentLifestyle > limitLifestyle ? 'exceeded' : ''}`}
                  style={{ width: `${Math.min(100, limitLifestyle > 0 ? (spentLifestyle / limitLifestyle) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Essenciais */}
            <div>
              <div className="progress-header">
                <span>Essenciais (Sobrevivência & Moradia)</span>
                <span>R$ {spentEssentials.toFixed(2)} / R$ {Number(profile?.limit_essentials || 8500).toFixed(2)}</span>
              </div>
              <div className="progress-bar-bg" style={{ marginTop: '0.35rem' }}>
                <div
                  className="progress-bar-fill essentials"
                  style={{ width: `${Math.min(100, Number(profile?.limit_essentials || 8500) > 0 ? (spentEssentials / (profile?.limit_essentials || 8500)) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Futuro */}
            <div>
              <div className="progress-header">
                <span>Futuro & Investimentos</span>
                <span>R$ {spentSavings.toFixed(2)} / R$ {Number(profile?.limit_savings || 1000).toFixed(2)}</span>
              </div>
              <div className="progress-bar-bg" style={{ marginTop: '0.35rem' }}>
                <div
                  className="progress-bar-fill savings"
                  style={{ width: `${Math.min(100, Number(profile?.limit_savings || 1000) > 0 ? (spentSavings / (profile?.limit_savings || 1000)) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
