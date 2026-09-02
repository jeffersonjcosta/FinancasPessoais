import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Wallet, Landmark, Building, PiggyBank } from 'lucide-react';
import { formatCurrency, isCashFlowExpense } from '../utils/finance';

export default function AccountsManager({
  accounts,
  incomes,
  expenses,
  selectedMonth,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    initial_balance: 0,
    icon: 'Landmark',
    type: 'movimentacao'
  });

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({ name: '', initial_balance: 0, icon: 'Landmark', type: 'movimentacao' });
    setShowModal(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      initial_balance: acc.initial_balance || 0,
      icon: acc.icon || 'Landmark',
      type: acc.type || 'movimentacao'
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingAccount) {
      onUpdateAccount(editingAccount.id, {
        name: formData.name,
        initial_balance: parseFloat(formData.initial_balance || 0),
        icon: formData.icon,
        type: formData.type
      });
    } else {
      onAddAccount({
        name: formData.name,
        initial_balance: parseFloat(formData.initial_balance || 0),
        icon: formData.icon,
        type: formData.type
      });
    }
    setShowModal(false);
  };

  const getAccountIcon = (iconName) => {
    switch (iconName) {
      case 'Wallet': return <Wallet size={24} />;
      case 'Building': return <Building size={24} />;
      case 'PiggyBank': return <PiggyBank size={24} />;
      default: return <Landmark size={24} />;
    }
  };

  // Compute calculated balance for each account in selected month or overall
  // Reservas: saldo acumulado (todas as datas). Movimentação: só o mês selecionado.
  // Compras no cartão não saem da conta (a fatura sai), por isso ficam de fora.
  const getAccountStats = (accId, isReserve = false) => {
    const inScope = (d) => isReserve || (d && d.startsWith(selectedMonth));
    const accIncomes = incomes.filter(i => i.account_id === accId && inScope(i.date));
    const accExpenses = expenses.filter(e => e.account_id === accId && isCashFlowExpense(e) && inScope(e.date));

    const totalIncome = accIncomes.reduce((sum, i) => sum + (i.actual_amount || 0), 0);
    const totalExpense = accExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
    const netMonth = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netMonth };
  };

  return (
    <div className="manager-container">
      <div className="section-header">
        <div>
          <h2>Gestão de Contas Bancárias & Fontes</h2>
          <p>Gerencie onde seu dinheiro entra e sai (Carteira, Conta Jeff, Conta Bel, etc.)</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="accounts-cards-grid">
        {[...accounts].sort((a, b) => (a.type === 'reserva') - (b.type === 'reserva')).map(acc => {
          const isReserve = acc.type === 'reserva';
          const { totalIncome, totalExpense, netMonth } = getAccountStats(acc.id, isReserve);
          const currentBalance = (acc.initial_balance || 0) + netMonth;

          return (
            <div key={acc.id} className="account-card">
              <div className="account-card-header">
                <div className="account-icon-wrapper">
                  {getAccountIcon(acc.icon)}
                </div>
                <div className="account-card-title">
                  <h3>{acc.name}</h3>
                  <span className="text-secondary text-sm">{isReserve ? 'Reserva / Investimento' : `Saldo no Mês (${selectedMonth})`}</span>
                </div>
                <div className="actions-cell">
                  <button className="icon-btn" onClick={() => handleOpenEdit(acc)} title="Editar">
                    <Edit2 size={15} />
                  </button>
                  {accounts.length > 1 && (
                    <button className="icon-btn icon-btn-danger" onClick={() => onDeleteAccount(acc.id)} title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="account-card-body">
                <div className="account-balance-main">
                  <span className="balance-label">{isReserve ? 'Saldo da Reserva' : 'Saldo em Movimentação'}</span>
                  <span className={`balance-value ${currentBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(currentBalance)}
                  </span>
                </div>

                <div className="account-stats-row">
                  <div className="stat-pill text-income">
                    <span>Entradas:</span>
                    <strong>{formatCurrency(totalIncome)}</strong>
                  </div>
                  <div className="stat-pill text-expense">
                    <span>Saídas:</span>
                    <strong>{formatCurrency(totalExpense)}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Conta / Fonte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta Corrente Jeff, Carteira..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ícone</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="Landmark">Banco / Conta Corrente</option>
                  <option value="Wallet">Carteira / Dinheiro</option>
                  <option value="Building">Empresa / Outra Conta</option>
                  <option value="PiggyBank">Reserva / Investimento</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="movimentacao">Conta de movimentação (entra e sai no mês)</option>
                  <option value="reserva">Reserva / Investimento (saldo acumulado)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
