import React from 'react';
import { LayoutDashboard, Receipt, CreditCard, UploadCloud, Landmark, SlidersHorizontal, Settings } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: Receipt },
    { id: 'cards', label: 'Cartões & Faturas', icon: CreditCard },
    { id: 'importer', label: 'Importar Extrato', icon: UploadCloud },
    { id: 'debts', label: 'Empréstimos', icon: Landmark },
    { id: 'planning', label: 'Planejamento', icon: SlidersHorizontal },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Navigation Fallback */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
