import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Calendar, ShieldCheck, ShieldAlert, TrendingUp, Layers, HelpCircle } from 'lucide-react';

export default function CreditCardsManager({
  creditCards = [],
  onAddCard,
  onDeleteCard,
  transactions = [],
  onAddTransaction
}) {
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [closingDay, setClosingDay] = useState('15');
  const [dueDay, setDueDay] = useState('24');
  const [color, setColor] = useState('#4f46e5');

  // Installment purchase form
  const [showInstallmentForm, setShowInstallmentForm] = useState(false);
  const [instCardId, setInstCardId] = useState('');
  const [instDesc, setInstDesc] = useState('');
  const [instTotalAmount, setInstTotalAmount] = useState('');
  const [instCount, setInstCount] = useState('10');
  const [instCategory, setInstCategory] = useState('lifestyle');

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddCard({
      name: name.trim(),
      limit_amount: Number(limitAmount) || 0,
      closing_day: Number(closingDay) || 1,
      due_day: Number(dueDay) || 10,
      color: color,
      reserved_cash: 0
    });

    setName('');
    setLimitAmount('');
  };

  const handleAddInstallmentPurchase = async (e) => {
    e.preventDefault();
    if (!instCardId || !instDesc || !instTotalAmount || !instCount) return;

    const total = Number(instTotalAmount);
    const count = Number(instCount);
    const monthlyVal = total / count;
    const today = new Date();

    // Create 'count' transactions for the upcoming months
    for (let i = 0; i < count; i++) {
      const txDate = new Date(today.getFullYear(), today.getMonth() + i, 15);
      const dateStr = txDate.toISOString().split('T')[0];

      await onAddTransaction({
        description: `${instDesc} (${i + 1}/${count})`,
        amount: Number(monthlyVal.toFixed(2)),
        type: 'expense',
        category: instCategory,
        sub_category: 'Compras Parceladas',
        card_id: instCardId,
        installment_info: `${i + 1}/${count}`,
        date: dateStr
      });
    }

    setInstDesc('');
    setInstTotalAmount('');
    setShowInstallmentForm(false);
    alert(`${count} parcelas no valor de R$ ${monthlyVal.toFixed(2)} criadas com sucesso!`);
  };

  // Current month filter
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const getCardCurrentInvoice = (cardId) => {
    return transactions
      .filter(t => {
        if (t.card_id !== cardId || t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  // Calculate CDI interest arbitrage gain (assuming 10.5% p.a. CDI rate ~ 0.039% per day)
  const calculateCdiArbitrage = (invoiceAmount, dueDayNumber) => {
    if (invoiceAmount <= 0) return 0;
    const currentDay = now.getDate();
    const daysUntilDue = dueDayNumber > currentDay ? dueDayNumber - currentDay : (30 - currentDay) + dueDayNumber;
    const dailyRate = Math.pow(1 + 0.105, 1 / 365) - 1;
    const estimatedYield = invoiceAmount * (Math.pow(1 + dailyRate, daysUntilDue) - 1);
    return { daysUntilDue, estimatedYield };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* YNAB Credit Card Method Explanation */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(30, 27, 75, 0.2))', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
          <ShieldCheck size={24} style={{ color: '#818cf8', flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#c7d2fe' }}>Reserva Automática de Liquidez para Fatura</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Cada compra no cartão de crédito <strong>deduz o valor da sua categoria de consumo</strong> e <strong>reserva o mesmo valor para o pagamento da fatura</strong>. Assim, o seu dinheiro permanece 100% seguro na conta e pode render CDI em liquidez diária até a data de vencimento!
            </p>
          </div>
        </div>
      </div>

      {/* Cards List Grid */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={22} style={{ color: 'var(--color-indigo)' }} /> Cartões de Crédito & Faturas ZBB
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Acompanhamento de cobertura de caixa, limites e compras parceladas.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowInstallmentForm(!showInstallmentForm)}
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Layers size={16} /> {showInstallmentForm ? 'Fechar Form' : 'Lançar Compra Parcelada'}
          </button>
        </div>

        {/* Form Installment Purchase */}
        {showInstallmentForm && (
          <form onSubmit={handleAddInstallmentPurchase} style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--card-border)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-indigo)' }}>Nova Compra Parcelada (Divisão Automática)</div>
            <div className="quick-inputs">
              <select
                className="input-glass"
                value={instCardId}
                onChange={(e) => setInstCardId(e.target.value)}
                required
              >
                <option value="">Selecione o Cartão...</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                type="text"
                className="input-glass"
                placeholder="Descrição (ex: Mentoria, Câmera)"
                value={instDesc}
                onChange={(e) => setInstDesc(e.target.value)}
                required
              />
            </div>

            <div className="quick-inputs">
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Valor Total (R$)"
                value={instTotalAmount}
                onChange={(e) => setInstTotalAmount(e.target.value)}
                required
              />

              <input
                type="number"
                min="2"
                max="48"
                className="input-glass"
                placeholder="Nº de Parcelas (ex: 10)"
                value={instCount}
                onChange={(e) => setInstCount(e.target.value)}
                required
              />

              <select
                className="input-glass"
                value={instCategory}
                onChange={(e) => setInstCategory(e.target.value)}
              >
                <option value="lifestyle">Estilo de Vida</option>
                <option value="essentials">Essencial</option>
                <option value="savings">Futuro</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">
              Gerar {instCount} Parcelas Automáticas
            </button>
          </form>
        )}

        {/* Cards Visual Overview */}
        {creditCards.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
            Nenhum cartão de crédito cadastrado. Cadastre seu cartão Credicard ou Bradesco abaixo.
          </div>
        ) : (
          <div className="cards-grid-3">
            {creditCards.map(card => {
              const currentInvoice = getCardCurrentInvoice(card.id);
              const limit = Number(card.limit_amount) || 0;
              const available = limit - currentInvoice;
              const usedPercent = limit > 0 ? (currentInvoice / limit) * 100 : 0;
              const { daysUntilDue, estimatedYield } = calculateCdiArbitrage(currentInvoice, card.due_day);
              
              // In ZBB, reserved cash matches current invoice spending if covered
              const reservedCash = Number(card.reserved_cash) || currentInvoice;
              const isFullyCovered = reservedCash >= currentInvoice;

              return (
                <div key={card.id} className="credit-card-widget" style={{ background: `linear-gradient(135deg, ${card.color || '#312e81'}, #0f172a)` }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>{card.name}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(card.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>
                      Fecha dia {card.closing_day} • Vence dia {card.due_day}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Fatura Atual</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      R$ {currentInvoice.toFixed(2)}
                    </div>
                  </div>

                  {/* Liquidity Coverage Badge */}
                  <div style={{
                    background: isFullyCovered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: isFullyCovered ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: isFullyCovered ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {isFullyCovered ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {isFullyCovered ? 'Fatura 100% Coberta' : 'Atenção: Sobregasto!'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reserva: R$ {reservedCash.toFixed(2)}</span>
                    </div>

                    {currentInvoice > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                        <TrendingUp size={12} /> Rendimento CDI estimado ({daysUntilDue} dias): +R$ {estimatedYield.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.3rem' }}>
                      <span>Disp: R$ {available.toFixed(2)}</span>
                      <span>Limite: R$ {limit.toFixed(2)}</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '6px' }}>
                      <div
                        className="progress-bar-fill lifestyle"
                        style={{ width: `${Math.min(100, usedPercent)}%`, background: usedPercent > 90 ? '#ef4444' : '#f59e0b' }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Card Form */}
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Cadastrar Novo Cartão de Crédito
        </h3>

        <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="quick-inputs">
            <input
              type="text"
              className="input-glass"
              placeholder="Nome do Cartão (ex: Credicard Black, Bradesco)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="Limite Total (R$)"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
            />
          </div>

          <div className="quick-inputs">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Dia do Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input-glass"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                required
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input-glass"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Cor de Destaque</label>
              <input
                type="color"
                className="input-glass"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ padding: '0.2rem', height: '42px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            <Plus size={18} /> Salvar Novo Cartão
          </button>
        </form>
      </div>
    </div>
  );
}

