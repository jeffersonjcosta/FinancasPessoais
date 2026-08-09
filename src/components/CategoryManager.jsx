import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Tag, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CategoryManager({
  categories,
  expenses,
  selectedMonth,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthly_limit: '',
    color: '#3b82f6'
  });

  const COLOR_OPTIONS = [
    '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981',
    '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#a855f7', '#f97316'
  ];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', monthly_limit: '', color: '#3b82f6' });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      monthly_limit: cat.monthly_limit ?? '',
      color: cat.color || '#3b82f6'
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      monthly_limit: parseFloat(formData.monthly_limit || 0),
      color: formData.color
    };

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, payload);
    } else {
      onAddCategory(payload);
    }

    setShowModal(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Calculate spent per category for selectedMonth
  const getCategoryStats = (catId, monthlyLimit) => {
    const monthExpenses = expenses.filter(e => e.category_id === catId && e.date && e.date.startsWith(selectedMonth));
    const totalSpent = monthExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
    const limit = monthlyLimit || 0;
    const percentage = limit > 0 ? (totalSpent / limit) * 100 : 0;

    let status = 'normal'; // green
    if (percentage > 100) status = 'exceeded'; // red
    else if (percentage >= 80) status = 'warning'; // yellow

    return { totalSpent, limit, percentage: Math.min(percentage, 100), rawPercentage: percentage, status };
  };

  return (
    <div className="manager-container">
      <div className="section-header">
        <div>
          <h2>Categorias & Limites Orçamentários</h2>
          <p>Defina as previsões mensais que servem como termômetro e aviso de atenção</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid of Categories with Progress Thermometer */}
      <div className="categories-grid">
        {categories.map(cat => {
          const { totalSpent, limit, percentage, rawPercentage, status } = getCategoryStats(cat.id, cat.monthly_limit);

          let progressClass = 'progress-normal';
          if (status === 'exceeded') progressClass = 'progress-danger';
          else if (status === 'warning') progressClass = 'progress-warning';

          return (
            <div key={cat.id} className="category-thermometer-card">
              <div className="category-card-top">
                <div className="category-title-badge">
                  <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-semibold text-lg">{cat.name}</span>
                </div>
                <div className="actions-cell">
                  <button className="icon-btn" onClick={() => handleOpenEdit(cat)} title="Editar">
                    <Edit2 size={15} />
                  </button>
                  <button className="icon-btn icon-btn-danger" onClick={() => onDeleteCategory(cat.id)} title="Excluir">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Progress Thermometer */}
              <div className="thermometer-body">
                <div className="thermometer-header">
                  <span className="text-secondary text-sm">Gasto em {selectedMonth}:</span>
                  <strong>{formatCurrency(totalSpent)} / {formatCurrency(limit)}</strong>
                </div>

                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${progressClass}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="thermometer-footer">
                  <span className="text-sm font-medium">
                    {rawPercentage.toFixed(0)}% da previsão utilizada
                  </span>
                  {status === 'exceeded' && (
                    <span className="badge badge-danger">
                      <AlertTriangle size={12} /> Limite Excedido
                    </span>
                  )}
                  {status === 'warning' && (
                    <span className="badge badge-warning">
                      <AlertTriangle size={12} /> Atenção (80%+)
                    </span>
                  )}
                  {status === 'normal' && (
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> Dentro da Previsão
                    </span>
                  )}
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
              <h3>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mercado, Gasolina, Lazer..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Previsão Mensal / Limite (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2500.00"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                />
                <span className="text-secondary text-xs" style={{ marginTop: '4px', display: 'block' }}>
                  Este valor será usado como limite e termômetro nos avisos de gastos da Home.
                </span>
              </div>

              <div className="form-group">
                <label>Cor de Identificação</label>
                <div className="color-picker-grid">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      type="button"
                      key={c}
                      className={`color-picker-btn ${formData.color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
