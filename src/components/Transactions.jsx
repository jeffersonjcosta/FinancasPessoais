import React, { useState } from 'react';
import { Trash2, Edit2, Search, Filter, ArrowUpCircle, ArrowDownCircle, CreditCard } from 'lucide-react';

export default function Transactions({
  transactions = [],
  onDeleteTransaction,
  onUpdateTransaction,
  creditCards = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const getCardName = (cardId) => {
    if (!cardId) return 'Conta / Pix';
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.name : 'Cartão';
  };

  const handleStartEdit = (tx) => {
    setEditingId(tx.id);
    setEditDesc(tx.description);
    setEditAmount(tx.amount.toString());
  };

  const handleSaveEdit = async (id) => {
    if (onUpdateTransaction) {
      await onUpdateTransaction(id, {
        description: editDesc,
        amount: Number(editAmount)
      });
    }
    setEditingId(null);
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.sub_category && t.sub_category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Extrato de Transações</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filtered.length} lançamentos encontrados</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Entradas</span>
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>+ R$ {totalIncome.toFixed(2)}</span>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Saídas</span>
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>- R$ {totalExpense.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-glass"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.3rem' }}
          />
        </div>

        <select
          className="input-glass"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="all">Todos os Tipos</option>
          <option value="expense">Apenas Despesas</option>
          <option value="income">Apenas Receitas</option>
        </select>

        <select
          className="input-glass"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="all">Todas Categorias</option>
          <option value="essentials">Essenciais</option>
          <option value="lifestyle">Estilo de Vida</option>
          <option value="savings">Futuro</option>
        </select>
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
          Nenhuma transação cadastrada.
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Subcategoria</th>
                <th>Forma / Cartão</th>
                <th>Valor (R$)</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const isEditing = editingId === tx.id;

                return (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input-glass"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {tx.type === 'expense' ? (
                            <ArrowDownCircle size={15} style={{ color: '#f87171' }} />
                          ) : (
                            <ArrowUpCircle size={15} style={{ color: '#34d399' }} />
                          )}
                          <span>{tx.description}</span>
                          {tx.installment_info && (
                            <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.2)', color: '#c4b5fd', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                              {tx.installment_info}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`pill-btn active ${tx.category}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                        {tx.sub_category || tx.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {getCardName(tx.card_id)}
                    </td>
                    <td style={{ fontWeight: 700 }} className={`tx-amount ${tx.type}`}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="input-glass"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '100px' }}
                        />
                      ) : (
                        `${tx.type === 'expense' ? '-' : '+'} R$ ${Number(tx.amount).toFixed(2)}`
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(tx.id)}
                            style={{ background: 'var(--color-indigo)', border: 'none', color: 'white', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Salvar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tx)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
