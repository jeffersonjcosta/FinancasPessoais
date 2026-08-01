import React, { useState } from 'react';
import { Tag, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function CategoryManager({ customCategories = [], onAddCategory, onDeleteCategory }) {
  const [name, setName] = useState('');
  const [macroCategory, setMacroCategory] = useState('lifestyle');
  const [budgetLimit, setBudgetLimit] = useState('');

  const defaultCategories = [
    { name: 'Alimentação / Mercado', macro: 'essentials', defaultLimit: 2500 },
    { name: 'Moradia / Financiamento', macro: 'essentials', defaultLimit: 3029.42 },
    { name: 'Saúde & Farmácia', macro: 'essentials', defaultLimit: 600 },
    { name: 'Transporte / Gasolina', macro: 'essentials', defaultLimit: 600 },
    { name: 'Restaurante / Delivery', macro: 'lifestyle', defaultLimit: 400 },
    { name: 'Lazer & Lanches', macro: 'lifestyle', defaultLimit: 400 },
    { name: 'Compras & Roupas', macro: 'lifestyle', defaultLimit: 500 },
    { name: 'Psicólogo & Cuidados', macro: 'lifestyle', defaultLimit: 320 },
    { name: 'Reserva de Emergência', macro: 'savings', defaultLimit: 1000 },
    { name: 'Investimentos', macro: 'savings', defaultLimit: 1000 },
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory({
      name: name.trim(),
      macro_category: macroCategory,
      budget_limit: Number(budgetLimit) || 0
    });
    setName('');
    setBudgetLimit('');
  };

  const getMacroLabel = (macro) => {
    switch (macro) {
      case 'essentials': return 'Essencial';
      case 'lifestyle': return 'Estilo de Vida';
      case 'savings': return 'Futuro';
      default: return macro;
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Tag size={20} style={{ color: 'var(--color-indigo)' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
          Gerenciar Categorias & Tetos Orçamentários
        </h2>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Defina limites (budgets) por categoria para receber alertas visuais quando os gastos atingirem 75% e 100%.
      </p>

      {/* Add New Category Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="quick-inputs">
          <input
            type="text"
            className="input-glass"
            placeholder="Nome da Categoria (ex: Petshop, Barbearia)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="number"
            step="0.01"
            className="input-glass"
            placeholder="Teto de Gasto Mês (R$)"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            style={{ width: '180px' }}
          />

          <select
            className="input-glass"
            value={macroCategory}
            onChange={(e) => setMacroCategory(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="lifestyle">Estilo de Vida</option>
            <option value="essentials">Essencial</option>
            <option value="savings">Futuro</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ background: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none', border: '1px solid var(--card-border)' }}>
          <Plus size={16} /> Adicionar Categoria com Teto
        </button>
      </form>

      {/* List of Custom & Default Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categorias Ativas & Limites</div>
        
        {/* Custom Categories */}
        {customCategories.map((cat) => (
          <div key={cat.id} className="transaction-item" style={{ padding: '0.6rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={`pill-btn active ${cat.macro_category}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                {getMacroLabel(cat.macro_category)}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {Number(cat.budget_limit) > 0 ? (
                <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 600 }}>
                  Teto: R$ {Number(cat.budget_limit).toFixed(2)}
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem teto fixado</span>
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
        ))}

        {/* Default Categories */}
        {defaultCategories.map((cat, idx) => (
          <div key={`default-${idx}`} className="transaction-item" style={{ padding: '0.55rem 0', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={`pill-btn active ${cat.macro}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                {getMacroLabel(cat.macro)}
              </span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat.name}</span>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Teto Sugerido: R$ {cat.defaultLimit.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
