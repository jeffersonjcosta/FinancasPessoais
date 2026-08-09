import React, { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Clock, Wallet, Search, Filter } from 'lucide-react';

export default function IncomesManager({
  incomes,
  accounts,
  selectedMonth,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    predicted_amount: '',
    actual_amount: '',
    account_id: accounts[0]?.id || 'acc-jeff',
    status: 'ok',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingIncome(null);
    setFormData({
      date: `${selectedMonth}-01`,
      description: '',
      predicted_amount: '',
      actual_amount: '',
      account_id: accounts[0]?.id || 'acc-jeff',
      status: 'ok',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (inc) => {
    setEditingIncome(inc);
    setFormData({
      date: inc.date || `${selectedMonth}-01`,
      description: inc.description || '',
      predicted_amount: inc.predicted_amount ?? '',
      actual_amount: inc.actual_amount ?? '',
      account_id: inc.account_id || accounts[0]?.id,
      status: inc.status || 'ok',
      notes: inc.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || (!formData.predicted_amount && !formData.actual_amount)) return;

    const payload = {
      date: formData.date,
      description: formData.description,
      predicted_amount: parseFloat(formData.predicted_amount || 0),
      actual_amount: parseFloat(formData.actual_amount || formData.predicted_amount || 0),
      account_id: formData.account_id,
      status: formData.status,
      notes: formData.notes
    };

    if (editingIncome) {
      onUpdateIncome(editingIncome.id, payload);
    } else {
      onAddIncome(payload);
    }

    setShowModal(false);
  };

  // Filter incomes by selected month (YYYY-MM), search term, account
  const monthIncomes = incomes.filter(inc => {
    const matchesMonth = inc.date && inc.date.startsWith(selectedMonth);
    const matchesAccount = accountFilter === 'all' || inc.account_id === accountFilter;
    const matchesSearch = !searchTerm || inc.description.toLowerCase().includes(searchTerm.toLowerCase()) || (inc.notes && inc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMonth && matchesAccount && matchesSearch;
  });

  const totalPredicted = monthIncomes.reduce((acc, i) => acc + (i.predicted_amount || 0), 0);
  const totalActual = monthIncomes.reduce((acc, i) => acc + (i.actual_amount || 0), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
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
          <h2>Gestão de Receitas</h2>
          <p>Cadastre e acompanhe as entradas de dinheiro por conta bancária</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Nova Receita</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-income">
          <span className="metric-label">Previsão de Receitas ({selectedMonth})</span>
          <span className="metric-value">{formatCurrency(totalPredicted)}</span>
        </div>
        <div className="metric-card metric-income">
          <span className="metric-label">Receita Realizada ({selectedMonth})</span>
          <span className="metric-value">{formatCurrency(totalActual)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total de Entradas no Mês</span>
          <span className="metric-value">{monthIncomes.length} lançamentos</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar receita por descrição ou obs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      {/* Incomes Table */}
      <div className="card-table-container">
        {monthIncomes.length === 0 ? (
          <div className="empty-state">
            <Wallet size={40} />
            <p>Nenhuma receita registrada para este mês/filtro.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Conta de Entrada</th>
                <th>Previsão</th>
                <th>Valor Real</th>
                <th>Status</th>
                <th>Obs</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {monthIncomes.map(inc => (
                <tr key={inc.id}>
                  <td>{inc.date ? new Date(inc.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="font-semibold">{inc.description}</td>
                  <td>
                    <span className="badge badge-account">
                      {getAccountName(inc.account_id)}
                    </span>
                  </td>
                  <td>{formatCurrency(inc.predicted_amount)}</td>
                  <td className="text-income font-bold">{formatCurrency(inc.actual_amount)}</td>
                  <td>
                    {inc.status === 'ok' ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Recebido
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Clock size={12} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="text-secondary text-sm">{inc.notes || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button className="icon-btn" onClick={() => handleOpenEdit(inc)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => onDeleteIncome(inc.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingIncome ? 'Editar Receita' : 'Nova Receita'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Descrição da Receita *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salário UFF, Verbo, Ajuda..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Conta de Entrada *</label>
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
                  <label>Valor Realizado (R$)</label>
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
                    <option value="ok">Recebido (OK)</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observação</label>
                  <input
                    type="text"
                    placeholder="Observações adicionais..."
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
                  {editingIncome ? 'Salvar Alterações' : 'Adicionar Receita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
