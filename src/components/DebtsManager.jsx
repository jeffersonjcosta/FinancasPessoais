import React, { useState } from 'react';
import { Landmark, Plus, Trash2, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';

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
  const [notes, setNotes] = useState('');

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (!creditor.trim() || !totalAmount) return;

    await onAddDebt({
      creditor_name: creditor.trim(),
      total_amount: Number(totalAmount),
      remaining_amount: Number(remainingAmount || totalAmount),
      monthly_payment: Number(monthlyPayment) || 0,
      notes: notes
    });

    setCreditor('');
    setTotalAmount('');
    setRemainingAmount('');
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
      category: 'essentials',
      sub_category: 'Pagamento de Dívida',
      date: new Date().toISOString().split('T')[0]
    });

    alert(`Abatimento de R$ ${payVal.toFixed(2)} registrado para ${debt.creditor_name}! Saldo restante: R$ ${newRemaining.toFixed(2)}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Landmark size={22} style={{ color: 'var(--color-indigo)' }} /> Empréstimos & Dívidas da Família
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Acompanhe a quitação gradual de empréstimos familiares e compromissos de longo prazo.
          </p>
        </div>

        {/* List of Active & Paid Debts */}
        <div className="cards-grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Suelena - Active */}
          {debts.length === 0 ? (
            <div className="category-alert-card yellow" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="alert-badge warning">Em Amortização</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>Suelena</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empréstimo Familiar (Parcelas mensais de R$ 1.000,00)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Restante</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fcd34d', fontFamily: 'var(--font-heading)' }}>R$ 12.000,00</div>
                </div>
              </div>

              <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
                <div className="progress-bar-fill lifestyle" style={{ width: '15%' }}></div>
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
            debts.map(debt => {
              const isPaid = debt.remaining_amount <= 0;
              const paidPercent = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

              return (
                <div key={debt.id} className={`category-alert-card ${isPaid ? '' : 'yellow'}`} style={{ opacity: isPaid ? 0.75 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      {isPaid ? (
                        <span className="alert-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>100% Quitado ✅</span>
                      ) : (
                        <span className="alert-badge warning">Em Amortização</span>
                      )}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem' }}>{debt.creditor_name}</h3>
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
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isPaid ? '#34d399' : '#fcd34d', fontFamily: 'var(--font-heading)' }}>
                        R$ {Number(debt.remaining_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
                    <div className="progress-bar-fill savings" style={{ width: `${Math.min(100, paidPercent)}%` }}></div>
                  </div>

                  {!isPaid && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleAmortize(debt)}
                      style={{ marginTop: '0.5rem', background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #f59e0b', color: '#fde68a' }}
                    >
                      <TrendingDown size={16} /> Abater R$ {Number(debt.monthly_payment || 1000).toFixed(2)}
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Thiago - Paid Badge */}
          <div className="category-alert-card" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="alert-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>100% Quitado ✅</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>Thiago</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remédio R$ 2.000 + Acampamento R$ 600</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--color-green)' }} />
                <div style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700 }}>R$ 0,00 Pendente</div>
              </div>
            </div>
          </div>

          {/* Eduardo e Cristina - Paid Badge */}
          <div className="category-alert-card" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="alert-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>100% Quitado ✅</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>Eduardo e Cristina</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empréstimo R$ 8.000,00</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--color-green)' }} />
                <div style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700 }}>R$ 0,00 Pendente</div>
              </div>
            </div>
          </div>
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
              placeholder="Nome do Credor (ex: Banco X, Familiar)"
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
          </div>

          <input
            type="text"
            className="input-glass"
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            <Plus size={18} /> Salvar Empréstimo
          </button>
        </form>
      </div>
    </div>
  );
}
