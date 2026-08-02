import React, { useState } from 'react';
import { Tag, Plus, Trash2, PiggyBank, Calendar, DollarSign } from 'lucide-react';

export default function CategoryManager({ customCategories = [], onAddCategory, onDeleteCategory }) {
  const [name, setName] = useState('');
  const [macroCategory, setMacroCategory] = useState('lifestyle');
  const [budgetLimit, setBudgetLimit] = useState('');
  
  // Sinking Fund Fields
  const [isSinkingFund, setIsSinkingFund] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const defaultCategories = [
    { name: 'Alimentação / Mercado', macro: 'essentials', defaultLimit: 2500, isFund: false },
    { name: 'Moradia / Financiamento', macro: 'essentials', defaultLimit: 3029.42, isFund: false },
    { name: 'Saúde & Farmácia', macro: 'essentials', defaultLimit: 600, isFund: false },
    { name: 'Transporte / Gasolina', macro: 'essentials', defaultLimit: 600, isFund: false },
    { name: 'IPVA & Seguro Auto', macro: 'savings', defaultLimit: 250, isFund: true, target: 3000, months: 12 },
    { name: 'Restaurante / Delivery', macro: 'lifestyle', defaultLimit: 400, isFund: false },
    { name: 'Lazer & Lanches', macro: 'lifestyle', defaultLimit: 400, isFund: false },
    { name: 'Fundo de Emergência', macro: 'savings', defaultLimit: 1000, isFund: true, target: 12000, months: 12 },
    { name: 'Investimentos', macro: 'savings', defaultLimit: 1000, isFund: false },
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory({
      name: name.trim(),
      macro_category: macroCategory,
      budget_limit: Number(budgetLimit) || 0,
      is_sinking_fund: isSinkingFund,
      target_amount: isSinkingFund ? Number(targetAmount) || 0 : 0,
      target_date: isSinkingFund ? targetDate : null
    });
    setName('');
    setBudgetLimit('');
    setIsSinkingFund(false);
    setTargetAmount('');
    setTargetDate('');
  };

  const getMacroLabel = (macro) => {
    switch (macro) {
      case 'essentials': return 'Habitação & Essencial';
      case 'lifestyle': return 'Estilo de Vida';
      case 'savings': return 'Reservas & Futuro';
      case 'debts': return 'Serviço de Dívida';
      default: return macro;
    }
  };

  const calculateMonthlyQuote = (target, dateStr) => {
    if (!target || !dateStr) return null;
    const targetD = new Date(dateStr);
    const now = new Date();
    const months = (targetD.getFullYear() - now.getFullYear()) * 12 + (targetD.getMonth() - now.getMonth());
    if (months <= 0) return target;
    return target / months;
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Tag size={20} style={{ color: 'var(--color-indigo)' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
          Categorias & Reservas de Aderência (Sinking Funds)
        </h2>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Crie categorias para orçamentação diária ou configure <strong>Reservas de Aderência (Sinking Funds)</strong> para suavizar gastos sazonais (IPVA, IPTU, Seguros) em cotas mensais.
      </p>

      {/* Add New Category Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="quick-inputs">
          <input
            type="text"
            className="input-glass"
            placeholder="Nome da Categoria (ex: IPVA Carro, Mercado)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="number"
            step="0.01"
            className="input-glass"
            placeholder="Alocação Mês (R$)"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            style={{ width: '160px' }}
          />

          <select
            className="input-glass"
            value={macroCategory}
            onChange={(e) => setMacroCategory(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="lifestyle">Estilo de Vida</option>
            <option value="essentials">Essencial</option>
            <option value="savings">Reservas & Futuro</option>
            <option value="debts">Serviço de Dívida</option>
          </select>
        </div>

        {/* Toggle Sinking Fund Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: '#c4b5fd' }}>
            <input
              type="checkbox"
              checked={isSinkingFund}
              onChange={(e) => setIsSinkingFund(e.target.checked)}
            />
            <PiggyBank size={16} /> Transformar em Reserva Sazonal (Sinking Fund)
          </label>
        </div>

        {isSinkingFund && (
          <div className="quick-inputs" style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Meta Total Alvo (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-glass"
                placeholder="Ex: 3000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Data Alvo do Vencimento</label>
              <input
                type="date"
                className="input-glass"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ background: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none', border: '1px solid var(--card-border)' }}>
          <Plus size={16} /> Adicionar Categoria / Reserva
        </button>
      </form>

      {/* List of Custom & Default Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categorias Ativas & Reservas</div>
        
        {/* Custom Categories */}
        {customCategories.map((cat) => {
          const monthlyQuote = calculateMonthlyQuote(cat.target_amount, cat.target_date);
          return (
            <div key={cat.id} className="transaction-item" style={{ padding: '0.65rem 0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`pill-btn active ${cat.macro_category}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                    {getMacroLabel(cat.macro_category)}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
                  {cat.is_sinking_fund && (
                    <span style={{ fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 600 }}>
                      Sinking Fund
                    </span>
                  )}
                </div>
                {cat.is_sinking_fund && cat.target_amount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Meta Total: R$ {Number(cat.target_amount).toFixed(2)} {monthlyQuote ? `• Cotas mensais de R$ ${monthlyQuote.toFixed(2)}/mês` : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {Number(cat.budget_limit) > 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 600 }}>
                    R$ {Number(cat.budget_limit).toFixed(2)}/mês
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem teto</span>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Default Categories */}
        {defaultCategories.map((cat, idx) => (
          <div key={`default-${idx}`} className="transaction-item" style={{ padding: '0.55rem 0', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={`pill-btn active ${cat.macro}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                {getMacroLabel(cat.macro)}
              </span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat.name}</span>
              {cat.isFund && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 600 }}>
                  Reserva Sazonal
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              R$ {cat.defaultLimit.toFixed(2)}/mês
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

