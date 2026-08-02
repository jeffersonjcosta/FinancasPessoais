import React, { useState, useEffect } from 'react';
import { Save, Repeat, Plus, Trash2, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import CategoryManager from './CategoryManager';

export default function Planning({
  profile,
  onSaveProfile,
  recurring,
  onAddRecurring,
  onDeleteRecurring,
  customCategories,
  onAddCategory,
  onDeleteCategory
}) {
  const [income, setIncome] = useState('');
  const [availableCash, setAvailableCash] = useState('');
  const [essentials, setEssentials] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [savings, setSavings] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // New recurring state
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCat, setRecCat] = useState('essentials');
  const [recDay, setRecDay] = useState('5');

  useEffect(() => {
    if (profile) {
      setIncome(profile.monthly_income || '');
      setAvailableCash(profile.available_cash || profile.monthly_income || '');
      setEssentials(profile.limit_essentials || '');
      setLifestyle(profile.limit_lifestyle || '');
      setSavings(profile.limit_savings || '');
    }
  }, [profile]);

  // ZBB Calculation: Pronto para Atribuir = Available Cash - Sum of Custom Category Budgets
  const totalAllocated = customCategories.reduce((acc, cat) => acc + (Number(cat.budget_limit) || 0), 0)
    + (Number(essentials) || 0) + (Number(lifestyle) || 0) + (Number(savings) || 0);

  const cashValue = Number(availableCash) || Number(income) || 0;
  const readyToAssign = cashValue - totalAllocated;

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSaveProfile({
      monthly_income: Number(income) || 0,
      available_cash: Number(availableCash) || 0,
      limit_essentials: Number(essentials) || 0,
      limit_lifestyle: Number(lifestyle) || 0,
      limit_savings: Number(savings) || 0,
    });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!recDesc || !recAmount) return;

    await onAddRecurring({
      description: recDesc,
      amount: Number(recAmount),
      category: recCat,
      due_day: Number(recDay) || 1
    });

    setRecDesc('');
    setRecAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ZBB Indicator Card */}
      <div className="glass-card" style={{
        background: readyToAssign === 0
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))'
          : readyToAssign > 0
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
        border: readyToAssign === 0
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : readyToAssign > 0
          ? '1px solid rgba(59, 130, 246, 0.4)'
          : '1px solid rgba(239, 68, 68, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Coins size={16} /> Motor ZBB (Orçamentação Base Zero)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: readyToAssign < 0 ? '#f87171' : readyToAssign === 0 ? '#34d399' : '#60a5fa' }}>
              R$ {readyToAssign.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {readyToAssign === 0 && 'Perfeito! Todo o seu dinheiro recebeu uma função (ZBB atingido).'}
              {readyToAssign > 0 && 'Você possui liquidez não atribuída. Aloque o saldo restante em categorias ou reservas.'}
              {readyToAssign < 0 && 'Alerta de sobrealocação! Você alocou mais dinheiro do que o disponível em conta.'}
            </div>
          </div>

          <div style={{ padding: '0.8rem', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}>
            {readyToAssign === 0 ? <CheckCircle2 size={32} color="#34d399" /> : <AlertCircle size={32} color={readyToAssign < 0 ? "#f87171" : "#60a5fa"} />}
          </div>
        </div>
      </div>

      {/* Monthly Budget Setup */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>Liquidez & Orçamento ZBB</h2>
        </div>

        {savedMsg && (
          <div className="traffic-message green" style={{ marginBottom: '1rem' }}>
            Orçamento salvo com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="quick-inputs">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Saldo Disponível em Conta (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 10000.00"
                value={availableCash}
                onChange={(e) => setAvailableCash(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Renda Mensal Prevista (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 17922.56"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#93c5fd', display: 'block', marginBottom: '0.3rem' }}>Alocação Habitação & Essenciais (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 8500.00"
                value={essentials}
                onChange={(e) => setEssentials(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#fde68a', display: 'block', marginBottom: '0.3rem' }}>Alocação Estilo de Vida & Lazer (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 2500.00"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#a7f3d0', display: 'block', marginBottom: '0.3rem' }}>Alocação Reservas & Futuro (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 1000.00"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Planejamento ZBB'}
          </button>
        </form>
      </div>


      {/* Custom Category Manager */}
      <CategoryManager
        customCategories={customCategories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* Recurring Expenses Setup */}
      <div className="glass-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Repeat size={18} /> Despesas Recorrentes Fixas
        </h2>

        <form onSubmit={handleAddRecurring} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
          <div className="quick-inputs">
            <input
              type="text"
              className="input-glass"
              placeholder="Ex: Aluguel, Netflix"
              value={recDesc}
              onChange={(e) => setRecDesc(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              className="input-glass"
              placeholder="R$ Valor"
              value={recAmount}
              onChange={(e) => setRecAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="input-glass"
              value={recCat}
              onChange={(e) => setRecCat(e.target.value)}
            >
              <option value="essentials">Essencial</option>
              <option value="lifestyle">Estilo de Vida</option>
              <option value="savings">Futuro</option>
            </select>

            <input
              type="number"
              min="1"
              max="31"
              className="input-glass"
              placeholder="Dia Vencimento"
              value={recDay}
              onChange={(e) => setRecDay(e.target.value)}
              style={{ width: '120px' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ background: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none', border: '1px solid var(--card-border)' }}>
            <Plus size={16} /> Adicionar Recorrente
          </button>
        </form>

        {recurring.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhuma despesa recorrente cadastrada.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recurring.map(item => (
              <div key={item.id} className="transaction-item" style={{ padding: '0.5rem 0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dia {item.due_day} • {item.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>R$ {Number(item.amount).toFixed(2)}</span>
                  <button type="button" onClick={() => onDeleteRecurring(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
