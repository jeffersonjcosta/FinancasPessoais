import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Layers,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Filter,
  X
} from 'lucide-react';
import FileImporter from './FileImporter';

export default function CreditCardsManager({
  creditCards = [],
  expenses = [],
  categories = [],
  accounts = [],
  selectedMonth = '2026-05',
  setSelectedMonth,
  onAddCard,
  onDeleteCard,
  onAddExpense,
  onDeleteExpense
}) {
  // New Card Form State
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [closingDay, setClosingDay] = useState('15');
  const [dueDay, setDueDay] = useState('24');
  const [color, setColor] = useState('#3b82f6');

  // Active Selected Card for Detailed Invoice View
  const [activeCardId, setActiveCardId] = useState(() => creditCards[0]?.id || 'card-credicard');

  // Installment purchase modal
  const [showInstallmentForm, setShowInstallmentForm] = useState(false);
  const [instCardId, setInstCardId] = useState('');
  const [instDesc, setInstDesc] = useState('');
  const [instTotalAmount, setInstTotalAmount] = useState('');
  const [instCount, setInstCount] = useState('3');
  const [instCategoryId, setInstCategoryId] = useState(categories[0]?.id || 'cat-outros');

  // File Importer Modal
  const [showImportModal, setShowImportModal] = useState(false);

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

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddCard({
      name: name.trim(),
      limit_amount: parseFloat(limitAmount) || 0,
      closing_day: parseInt(closingDay, 10) || 15,
      due_day: parseInt(dueDay, 10) || 24,
      color: color,
      reserved_cash: 0
    });

    setName('');
    setLimitAmount('');
  };

  const handleAddInstallmentPurchase = (e) => {
    e.preventDefault();
    const targetCardId = instCardId || activeCardId || creditCards[0]?.id;
    if (!targetCardId || !instDesc || !instTotalAmount || !instCount) return;

    const total = parseFloat(instTotalAmount);
    const count = parseInt(instCount, 10);
    const monthlyVal = parseFloat((total / count).toFixed(2));
    
    // Parse starting date
    const [yStr, mStr] = selectedMonth.split('-');
    let startYear = parseInt(yStr, 10);
    let startMonth = parseInt(mStr, 10) - 1; // 0-indexed

    for (let i = 0; i < count; i++) {
      const dt = new Date(startYear, startMonth + i, 10);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      onAddExpense({
        date: dateStr,
        description: `${instDesc} (${i + 1}/${count})`,
        category_id: instCategoryId,
        predicted_amount: monthlyVal,
        actual_amount: monthlyVal,
        payment_method: 'Cartão de Crédito',
        card_id: targetCardId,
        installment_info: `${i + 1}/${count}`,
        account_id: accounts[0]?.id || 'acc-jeff',
        status: 'pendente',
        notes: `Compra parcelada (${i + 1} de ${count})`
      });
    }

    setInstDesc('');
    setInstTotalAmount('');
    setShowInstallmentForm(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Helper to check if an expense matches a credit card
  const isExpenseForCard = (exp, card) => {
    if (!exp.date || !exp.date.startsWith(selectedMonth)) return false;
    
    // Explicit card_id match
    if (exp.card_id && exp.card_id === card.id) return true;

    // Payment method match or description match
    const isCredit = exp.payment_method === 'Cartão de Crédito' || (exp.category_id && exp.category_id.includes('cartao'));
    const descLower = (exp.description || '').toLowerCase();
    const cardNameLower = (card.name || '').toLowerCase();

    if (cardNameLower.includes('credicard') && (descLower.includes('credicard') || exp.category_id === 'cat-credicard')) return true;
    if (cardNameLower.includes('bradesco') && (descLower.includes('bradesco') || exp.category_id === 'cat-bradesco')) return true;

    return isCredit && (!exp.card_id || exp.card_id === card.id);
  };

  // Calculate current invoice total per card
  const getCardInvoiceAmount = (card) => {
    return expenses
      .filter(e => isExpenseForCard(e, card))
      .reduce((sum, e) => sum + (e.actual_amount || e.predicted_amount || 0), 0);
  };

  // Get active card object
  const currentCard = creditCards.find(c => c.id === activeCardId) || creditCards[0] || {
    id: 'card-credicard',
    name: 'Cartão Credicard',
    limit_amount: 1700,
    closing_day: 15,
    due_day: 24,
    color: '#3b82f6'
  };

  // Filter invoice items for active card in selectedMonth
  const activeInvoiceExpenses = expenses.filter(e => isExpenseForCard(e, currentCard));
  const activeInvoiceTotal = activeInvoiceExpenses.reduce((sum, e) => sum + (e.actual_amount || e.predicted_amount || 0), 0);
  const activeLimit = currentCard.limit_amount || 0;
  const activeAvailable = activeLimit - activeInvoiceTotal;
  const activeUsedPct = activeLimit > 0 ? (activeInvoiceTotal / activeLimit) * 100 : 0;

  // Batch import callback
  const handleBatchImport = (importedList) => {
    importedList.forEach(item => {
      onAddExpense({
        date: item.date || `${selectedMonth}-10`,
        description: item.description,
        category_id: categories[0]?.id || 'cat-outros',
        predicted_amount: item.amount,
        actual_amount: item.amount,
        payment_method: 'Cartão de Crédito',
        card_id: currentCard.id,
        account_id: accounts[0]?.id || 'acc-jeff',
        status: 'pendente',
        notes: 'Importado de extrato/fatura'
      });
    });
    setShowImportModal(false);
  };

  return (
    <div className="manager-container">
      {/* Header & Card Selector */}
      <div className="section-header">
        <div>
          <h2>Gestão de Cartões de Crédito & Faturas</h2>
          <p>Acompanhamento de faturas mensais, compras parceladas e limites disponíveis</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => setShowImportModal(true)}>
            <UploadCloud size={18} />
            <span>Importar Fatura (XLS / CSV / OFX)</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowInstallmentForm(true)}>
            <Layers size={18} />
            <span>Lançar Compra Parcelada</span>
          </button>
        </div>
      </div>

      {/* Credit Cards Summary Grid */}
      <div className="cards-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {creditCards.map(card => {
          const invTotal = getCardInvoiceAmount(card);
          const limit = card.limit_amount || 0;
          const available = limit - invTotal;
          const pct = limit > 0 ? (invTotal / limit) * 100 : 0;
          const isSelected = card.id === (currentCard?.id);

          return (
            <div
              key={card.id}
              onClick={() => setActiveCardId(card.id)}
              style={{
                background: `linear-gradient(135deg, ${card.color || '#3b82f6'}22, #0f172a)`,
                border: isSelected ? `2px solid ${card.color || '#3b82f6'}` : '1px solid var(--border-color, #1e293b)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 15px ${card.color || '#3b82f6'}40` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: card.color }}></div>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{card.name}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
                  title="Excluir Cartão"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Fecha dia {card.closing_day} • Vence dia {card.due_day}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Fatura de {selectedMonth}:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
                  {formatCurrency(invTotal)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                <span>Disponível: <strong style={{ color: available >= 0 ? '#34d399' : '#f87171' }}>{formatCurrency(available)}</strong></span>
                <span>Limite: {formatCurrency(limit)}</span>
              </div>

              <div className="progress-bar-track" style={{ height: '6px' }}>
                <div
                  className={`progress-bar-fill ${pct > 100 ? 'progress-danger' : pct >= 80 ? 'progress-warning' : 'progress-normal'}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Invoice View ("Como Uma Fatura Mesmo") */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: currentCard?.color || '#3b82f6' }} />
              Fatura Detalhada: {currentCard?.name} ({selectedMonth})
            </h2>
            <p>Lista de despesas e compras parceladas lançadas nesta fatura</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="month-picker-container">
              <Calendar size={16} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth && setSelectedMonth(e.target.value)}
                className="month-picker-select"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Summary Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color, #1e293b)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total da Fatura</span>
            <strong style={{ fontSize: '1.25rem', color: '#f8fafc' }}>{formatCurrency(activeInvoiceTotal)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Limite Disponível</span>
            <strong style={{ fontSize: '1.25rem', color: activeAvailable >= 0 ? '#34d399' : '#f87171' }}>{formatCurrency(activeAvailable)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Uso do Limite</span>
            <strong style={{ fontSize: '1.25rem', color: activeUsedPct >= 100 ? '#f87171' : activeUsedPct >= 80 ? '#fbbf24' : '#34d399' }}>{activeUsedPct.toFixed(0)}%</strong>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="card-table-container">
          {activeInvoiceExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              <CreditCard size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>Nenhuma despesa ou compra parcelada encontrada para esta fatura em {selectedMonth}.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Parcela</th>
                  <th>Valor da Parcela</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {activeInvoiceExpenses.map(exp => {
                  const cat = categories.find(c => c.id === exp.category_id) || { name: 'Outros', color: '#8b5cf6' };
                  const val = exp.actual_amount || exp.predicted_amount || 0;
                  const instMatch = exp.description.match(/\((\d+\/\d+)\)/) || exp.notes?.match(/\((\d+\/\d+)\)/);
                  const instInfo = exp.installment_info || (instMatch ? instMatch[1] : 'À vista');

                  return (
                    <tr key={exp.id}>
                      <td>{exp.date ? new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="font-semibold">{exp.description}</td>
                      <td>
                        <span
                          className="badge-category"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}50` }}
                        >
                          {cat.name}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-subtle" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                          {instInfo}
                        </span>
                      </td>
                      <td className="text-expense font-bold">{formatCurrency(val)}</td>
                      <td>
                        {exp.status === 'ok' ? (
                          <span className="badge badge-success"><CheckCircle2 size={12} /> Pago</span>
                        ) : (
                          <span className="badge badge-warning"><Clock size={12} /> Fatura Aberta</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn icon-btn-danger" onClick={() => onDeleteExpense(exp.id)} title="Remover da Fatura">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form New Credit Card */}
      <div className="dashboard-section-card" style={{ marginTop: '1.5rem' }}>
        <h3>Cadastrar Novo Cartão de Crédito</h3>
        <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome do Cartão *</label>
              <input
                type="text"
                required
                placeholder="Ex: Cartão Itaú Personalité, Cartão Nubank..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Limite Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 5000.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dia do Fechamento da Fatura</label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Dia do Vencimento da Fatura</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cor de Identificação</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ height: '42px', padding: '2px', cursor: 'pointer', width: '100%' }}
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> Salvar Novo Cartão
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Installment Purchase */}
      {showInstallmentForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Lançar Compra Parcelada no Cartão</h3>
              <button className="close-btn" onClick={() => setShowInstallmentForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddInstallmentPurchase}>
              <div className="form-group">
                <label>Cartão de Crédito *</label>
                <select
                  value={instCardId || currentCard.id}
                  onChange={(e) => setInstCardId(e.target.value)}
                >
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descrição da Compra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notebook, Smartphone, Seguro..."
                  value={instDesc}
                  onChange={(e) => setInstDesc(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Total da Compra (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 1200.00"
                    value={instTotalAmount}
                    onChange={(e) => setInstTotalAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Quantidade de Parcelas *</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    required
                    value={instCount}
                    onChange={(e) => setInstCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoria *</label>
                <select
                  value={instCategoryId}
                  onChange={(e) => setInstCategoryId(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.825rem', color: '#93c5fd', marginBottom: '1rem' }}>
                💡 O valor total de {formatCurrency(parseFloat(instTotalAmount || 0))} será dividido em {instCount || 1}x de {formatCurrency(parseFloat(instTotalAmount || 0) / parseInt(instCount || 1, 10))} por mês automaticamente nas faturas seguintes.
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInstallmentForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Gerar Parcelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: File Importer */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Importar Fatura / Extrato do Cartão</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>&times;</button>
            </div>
            <FileImporter
              creditCards={creditCards}
              customCategories={categories}
              onBatchImport={handleBatchImport}
            />
          </div>
        </div>
      )}
    </div>
  );
}
