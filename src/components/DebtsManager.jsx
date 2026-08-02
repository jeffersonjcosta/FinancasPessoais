import React, { useState } from 'react';
import { Landmark, Plus, Trash2, CheckCircle2, TrendingDown, Zap, Snowflake, BarChart2 } from 'lucide-react';

export default function DebtsManager({
  debts = [],
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onAddTransaction
}) {
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('1000');
  const [interestRate, setInterestRate] = useState('0');
  const [notes, setNotes] = useState('');

  // Strategy Mode: 'avalanche' | 'snowball'
  const [strategy, setStrategy] = useState('snowball');

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (!creditor.trim() || !totalAmount) return;

    await onAddDebt({
      creditor_name: creditor.trim(),
      total_amount: Number(totalAmount),
      remaining_amount: Number(remainingAmount || totalAmount),
      monthly_payment: Number(monthlyPayment) || 0,
      interest_rate: Number(interestRate) || 0,
      notes: notes
    });

    setCreditor('');
    setTotalAmount('');
    setRemainingAmount('');
    setInterestRate('0');
    setNotes('');
  };

  const handleAmortize = async (debt) => {
    const payVal = debt.monthly_payment || 1000;
    const newRemaining = Math.max(0, debt.remaining_amount - payVal);

    await onUpdateDebt(debt.id, {
      remaining_amount: newRemaining
    });

    // Automatically create transaction record for history
    await onAddTransaction({
      description: `Amortização Empréstimo (${debt.creditor_name})`,
      amount: payVal,
      type: 'expense',
      category: 'debts',
      sub_category: 'Pagamento de Dívida',
      date: new Date().toISOString().split('T')[0]
    });

    alert(`Abatimento de R$ ${payVal.toFixed(2)} registrado para ${debt.creditor_name}! Saldo restante: R$ ${newRemaining.toFixed(2)}`);
  };

  // Sort debts based on strategy
  const activeDebts = debts.filter(d => Number(d.remaining_amount) > 0);
  const paidDebts = debts.filter(d => Number(d.remaining_amount) <= 0);

  const sortedActiveDebts = [...activeDebts].sort((a, b) => {
    if (strategy === 'avalanche') {
      // Highest interest rate first
      return (Number(b.interest_rate) || 0) - (Number(a.interest_rate) || 0);
    } else {
      // Lowest remaining amount first (Snowball)
      return (Number(a.remaining_amount) || 0) - (Number(b.remaining_amount) || 0);
    }
  });

  const totalRemainingDebt = activeDebts.reduce((sum, d) => sum + Number(d.remaining_amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Strategy Selector Header Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={22} style={{ color: 'var(--color-indigo)' }} /> Amortização de Passivos & Dívidas
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Devedor em Aberto: <strong style={{ color: '#fcd34d', fontSize: '1rem' }}>R$ {totalRemainingDebt.toFixed(2)}</strong>
            </p>
          </div>

          {/* Strategy Toggle Buttons */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
            <button
              type="button"
              onClick={() => setStrategy('snowball')}
              style={{
                background: strategy === 'snowball' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                border: strategy === 'snowball' ? '1px solid #3b82f6' : 'none',
                color: strategy === 'snowball' ? '#93c5fd' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Snowflake size={14} /> Bola de Neve (Psicológico)
            </button>

            <button
              type="button"
              onClick={() => setStrategy('avalanche')}
              style={{
                background: strategy === 'avalanche' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                border: strategy === 'avalanche' ? '1px solid #ef4444' : 'none',
                color: strategy === 'avalanche' ? '#fca5a5' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Zap size={14} /> Avalancha (Menos Juros)
            </button>
          </div>
        </div>

        {/* Dynamic Explanation Banner */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: strategy === 'avalanche' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: `1px solid ${strategy === 'avalanche' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {strategy === 'snowball' ? (
            <span><strong>Método Bola de Neve:</strong> Prioriza a quitação do menor saldo devedor primeiro. Gera vitórias psicológicas rápidas para engajamento e redução acelerada do número de contratos.</span>
          ) : (
            <span><strong>Método Avalancha:</strong> Prioriza a dívida com a maior taxa de juros (%). Matematicamente superior, economizando o máximo de dinheiro em juros ao longo do tempo.</span>
          )}
        </div>
      </div>

      {/* Main Grid for Debts */}
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Ordem de Prioridade no Método {strategy === 'avalanche' ? 'Avalancha (Juros Maiores)' : 'Bola de Neve (Menor Saldo)'}
        </h3>

        <div className="cards-grid-2" style={{ marginBottom: '1rem' }}>
          {debts.length === 0 ? (
            <div className="category-alert-card yellow" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="alert-badge warning">Em Amortização</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>Suelena</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empréstimo Familiar (R$ 1.000/mês)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Restante</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fcd34d', fontFamily: 'var(--font-heading)' }}>R$ 12.000,00</div>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => handleAmortize({ id: 'suelena-default', creditor_name: 'Suelena', remaining_amount: 12000, monthly_payment: 1000 })}
                style={{ marginTop: '0.5rem', background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #f59e0b', color: '#fde68a' }}
              >
                <TrendingDown size={16} /> Registrar Pagamento de R$ 1.000,00
              </button>
            </div>
          ) : (
            sortedActiveDebts.map((debt, index) => {
              const paidPercent = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

              return (
                <div key={debt.id} className="category-alert-card yellow" style={{ position: 'relative' }}>
                  {/* Priority Number Pill */}
                  <div style={{ position: 'absolute', top: '-10px', right: '12px', background: strategy === 'avalanche' ? '#ef4444' : '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Prioridade #{index + 1}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="alert-badge warning">Em Amortização</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem' }}>{debt.creditor_name}</h3>
                      {debt.interest_rate > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>
                          Taxa de Juros: {debt.interest_rate}% a.m.
                        </div>
                      )}
                      {debt.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{debt.notes}</div>}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDebt(debt.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Original: R$ {Number(debt.total_amount).toFixed(2)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pagamento Mensal: R$ {Number(debt.monthly_payment).toFixed(2)}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restam</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fcd34d', fontFamily: 'var(--font-heading)' }}>
                        R$ {Number(debt.remaining_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar-fill savings" style={{ width: `${Math.min(100, paidPercent)}%` }}></div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleAmortize(debt)}
                    style={{ marginTop: '0.5rem', background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #f59e0b', color: '#fde68a' }}
                  >
                    <TrendingDown size={16} /> Abater R$ {Number(debt.monthly_payment || 1000).toFixed(2)}
                  </button>
                </div>
              );
            })
          )}

          {/* Paid Debts Badges */}
          {paidDebts.map(debt => (
            <div key={debt.id} className="category-alert-card" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', opacity: 0.85 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="alert-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>100% Quitado ✅</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>{debt.creditor_name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{debt.notes || 'Contrato Finalizado'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--color-green)' }} />
                  <div style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700 }}>R$ 0,00 Pendente</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form New Debt */}
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Cadastrar Novo Compromisso / Empréstimo
        </h3>

        <form onSubmit={handleCreateDebt} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="quick-inputs">
            <input
              type="text"
              className="input-glass"
              placeholder="Nome do Credor (ex: Suelena, Banco X)"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="Valor Total Original (R$)"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>

          <div className="quick-inputs">
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="Saldo Restante Atual (R$)"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="Valor da Parcela Mensal (R$)"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="Taxa Juros Mês (%)"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              style={{ width: '150px' }}
            />
          </div>

          <input
            type="text"
            className="input-glass"
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            <Plus size={18} /> Salvar Empréstimo / Passivo
          </button>
        </form>
      </div>
    </div>
  );
}

