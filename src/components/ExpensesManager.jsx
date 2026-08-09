import React, { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Clock, Search, Filter, CreditCard } from 'lucide-react';

export default function ExpensesManager({
  expenses,
  categories,
  accounts,
  selectedMonth,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  const PAYMENT_METHODS = [
    'PIX',
    'Cartão de Crédito',
    'Dinheiro',
    'Débito',
    'Transferência Bancária'
  ];

  const [formData, setFormData] = useState({
    date: `${selectedMonth}-10`,
    description: '',
    category_id: categories[0]?.id || 'cat-alimentacao',
    predicted_amount: '',
    actual_amount: '',
    payment_method: 'PIX',
    account_id: accounts[0]?.id || 'acc-jeff',
    status: 'ok',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      date: `${selectedMonth}-10`,
      description: '',
      category_id: categories[0]?.id || 'cat-alimentacao',
      predicted_amount: '',
      actual_amount: '',
      payment_method: 'PIX',
      account_id: accounts[0]?.id || 'acc-jeff',
      status: 'ok',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.date || `${selectedMonth}-10`,
      description: exp.description || '',
      category_id: exp.category_id || categories[0]?.id,
      predicted_amount: exp.predicted_amount ?? '',
      actual_amount: exp.actual_amount ?? '',
      payment_method: exp.payment_method || 'PIX',
      account_id: exp.account_id || accounts[0]?.id,
      status: exp.status || 'ok',
      notes: exp.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || (!formData.predicted_amount && !formData.actual_amount)) return;

    const payload = {
      date: formData.date,
      description: formData.description,
      category_id: formData.category_id,
      predicted_amount: parseFloat(formData.predicted_amount || 0),
      actual_amount: parseFloat(formData.actual_amount || formData.predicted_amount || 0),
      payment_method: formData.payment_method,
      account_id: formData.account_id,
      status: formData.status,
      notes: formData.notes
    };

    if (editingExpense) {
      onUpdateExpense(editingExpense.id, payload);
    } else {
      onAddExpense(payload);
    }

    setShowModal(false);
  };

  // Filter expenses by selected month (YYYY-MM), category, account, search
  const monthExpenses = expenses.filter(exp => {
    const matchesMonth = exp.date && exp.date.startsWith(selectedMonth);
    const matchesCat = categoryFilter === 'all' || exp.category_id === categoryFilter;
    const matchesAcc = accountFilter === 'all' || exp.account_id === accountFilter;
    const matchesSearch = !searchTerm || exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMonth && matchesCat && matchesAcc && matchesSearch;
  });

  const totalPredicted = monthExpenses.reduce((acc, e) => acc + (e.predicted_amount || 0), 0);
  const totalActual = monthExpenses.reduce((acc, e) => acc + (e.actual_amount || 0), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const getCategory = (catId) => {
    return categories.find(c => c.id === catId) || { name: 'Outros', color: '#8b5cf6' };
  };

  const getAccountName = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Conta Não Especificada';
  };

  return (
    <div className="manager-container">
      {/* Header & Actions */}
      <div className="section-header">
        <div>
          <h2>Gestão de Despesas</h2>
          <p>Lançamento de contas com data, forma de pagamento, conta pagadora e categoria</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-expense">
          <span className="metric-label">Previsão de Despesas ({selectedMonth})</span>
          <span className="metric-value">{formatCurrency(totalPredicted)}</span>
        </div>
        <div className="metric-card metric-expense">
          <span className="metric-label">Despesas Realizadas ({selectedMonth})</span>
          <span className="metric-value">{formatCurrency(totalActual)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Lançamentos no Mês</span>
          <span className="metric-value">{monthExpenses.length} despesas</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar despesa por nome ou observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-wrapper">
          <Filter size={16} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrapper">
          <Filter size={16} />
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="all">Todas as Contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-table-container">
        {monthExpenses.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={40} />
            <p>Nenhuma despesa registrada para este mês/filtro.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Venc / Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Forma Pagto</th>
                <th>Conta Origem</th>
                <th>Previsão</th>
                <th>Valor Real</th>
                <th>Status</th>
                <th>Obs</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {monthExpenses.map(exp => {
                const cat = getCategory(exp.category_id);
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
                    <td><span className="badge badge-subtle">{exp.payment_method || 'PIX'}</span></td>
                    <td><span className="badge badge-account">{getAccountName(exp.account_id)}</span></td>
                    <td>{formatCurrency(exp.predicted_amount)}</td>
                    <td className="text-expense font-bold">{formatCurrency(exp.actual_amount)}</td>
                    <td>
                      {exp.status === 'ok' ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Pago
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="text-secondary text-sm">{exp.notes || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button className="icon-btn" onClick={() => handleOpenEdit(exp)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => onDeleteExpense(exp.id)} title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição da Despesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mercado, Financiamento, Colégio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data de Vencimento / Compra *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>De Qual Conta Foi Pago? *</label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Previsão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.predicted_amount}
                    onChange={(e) => setFormData({ ...formData, predicted_amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Valor Realizado / Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.actual_amount}
                    onChange={(e) => setFormData({ ...formData, actual_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ok">Pago / OK</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <input
                    type="text"
                    placeholder="Observações ou detalhes adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Salvar Alterações' : 'Lançar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
