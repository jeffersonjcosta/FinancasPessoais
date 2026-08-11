import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncomesManager from './components/IncomesManager';
import ExpensesManager from './components/ExpensesManager';
import AccountsManager from './components/AccountsManager';
import CategoryManager from './components/CategoryManager';
import CreditCardsManager from './components/CreditCardsManager';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_CATEGORIES,
  INITIAL_INCOMES,
  INITIAL_EXPENSES
} from './data/initialData';
import {
  ShieldCheck,
  Calendar,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Landmark,
  Tag,
  LogOut,
  RotateCcw
} from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const MIGRATION_VERSION = 'v2_macro_categories';

  // Accounts state
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('FIN_ACCOUNTS');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Categories & Expenses state with auto-migration
  const [categories, setCategories] = useState(() => {
    const dataVersion = localStorage.getItem('FIN_DATA_VERSION');
    const saved = localStorage.getItem('FIN_CATEGORIES');
    if (dataVersion !== MIGRATION_VERSION || !saved) {
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(saved);
  });

  // Incomes state
  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem('FIN_INCOMES');
    return saved ? JSON.parse(saved) : INITIAL_INCOMES;
  });

  // Expenses state
  const [expenses, setExpenses] = useState(() => {
    const dataVersion = localStorage.getItem('FIN_DATA_VERSION');
    const saved = localStorage.getItem('FIN_EXPENSES');
    if (dataVersion !== MIGRATION_VERSION || !saved) {
      localStorage.setItem('FIN_DATA_VERSION', MIGRATION_VERSION);
      localStorage.setItem('FIN_CATEGORIES', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('FIN_EXPENSES', JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(saved);
  });

  // Credit Cards state
  const [creditCards, setCreditCards] = useState(() => {
    const saved = localStorage.getItem('FIN_CREDIT_CARDS');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_CARDS;
  });

  useEffect(() => {
    localStorage.setItem('FIN_CREDIT_CARDS', JSON.stringify(creditCards));
  }, [creditCards]);

  const handleAddCard = (newCard) => {
    const item = { ...newCard, id: 'card-' + Date.now() };
    setCreditCards(prev => [...prev, item]);
  };

  const handleDeleteCard = (cardId) => {
    setCreditCards(prev => prev.filter(c => c.id !== cardId));
  };
  useEffect(() => {
    localStorage.setItem('FIN_ACCOUNTS', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('FIN_CATEGORIES', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('FIN_INCOMES', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('FIN_EXPENSES', JSON.stringify(expenses));
  }, [expenses]);

  // Auth State
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoadingAuth(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handlers for Incomes
  const handleAddIncome = (newInc) => {
    const item = { ...newInc, id: 'inc-' + Date.now() };
    setIncomes(prev => [item, ...prev]);
  };

  const handleUpdateIncome = (id, updatedFields) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updatedFields } : i));
  };

  const handleDeleteIncome = (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  // Handlers for Expenses
  const handleAddExpense = (newExp) => {
    const item = { ...newExp, id: 'exp-' + Date.now() };
    setExpenses(prev => [item, ...prev]);
  };

  const handleUpdateExpense = (id, updatedFields) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedFields } : e));
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Handlers for Accounts
  const handleAddAccount = (newAcc) => {
    const item = { ...newAcc, id: 'acc-' + Date.now() };
    setAccounts(prev => [...prev, item]);
  };

  const handleUpdateAccount = (id, updatedFields) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  const handleDeleteAccount = (id) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Handlers for Categories
  const handleAddCategory = (newCat) => {
    const item = { ...newCat, id: 'cat-' + Date.now() };
    setCategories(prev => [...prev, item]);
  };

  const handleUpdateCategory = (id, updatedFields) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Reset to initial spreadsheet data
  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados originais da planilha FINANCEIRO 2026? Suas alterações locais serão sobrescritas.')) {
      setAccounts(INITIAL_ACCOUNTS);
      setCategories(INITIAL_CATEGORIES);
      setIncomes(INITIAL_INCOMES);
      setExpenses(INITIAL_EXPENSES);
      localStorage.removeItem('FIN_ACCOUNTS');
      localStorage.removeItem('FIN_CATEGORIES');
      localStorage.removeItem('FIN_INCOMES');
      localStorage.removeItem('FIN_EXPENSES');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  if (loadingAuth) {
    return (
      <div className="loading-screen">
        <div className="app-logo-icon spinner">
          <ShieldCheck size={32} />
        </div>
        <p>Carregando Gestão Financeira...</p>
      </div>
    );
  }

  if (isSupabaseConfigured() && !user) {
    return <Auth onLoginSuccess={(u) => setUser(u)} />;
  }

  const navMenuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'receitas', label: 'Receitas', icon: TrendingUp },
    { id: 'despesas', label: 'Despesas', icon: TrendingDown },
    { id: 'contas', label: 'Contas', icon: Landmark },
    { id: 'categorias', label: 'Categorias', icon: Tag },
  ];

  return (
    <div className="app-container">
      {/* Desktop Navigation Sidebar */}
      <aside className="desktop-sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="app-logo-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="sidebar-brand">
              <span className="app-title">Financeiro 2026</span>
              <span className="app-subtitle">Gestão Pessoal Simples</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-item btn-reset" onClick={handleResetData} title="Restaurar dados da Planilha">
            <RotateCcw size={16} />
            <span>Restaurar Planilha</span>
          </button>

          {user && (
            <button className="sidebar-item btn-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-title-area">
            <h1>Controle Financeiro Familiar</h1>
            <p>Planilha Integrada • Contas, Receitas, Despesas & Limites</p>
          </div>

          <div className="header-month-badge">
            <Calendar size={15} />
            <span>Mês selecionado: <strong>{selectedMonth}</strong></span>
          </div>
        </header>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard
              incomes={incomes}
              expenses={expenses}
              categories={categories}
              accounts={accounts}
              creditCards={creditCards}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'receitas' && (
            <IncomesManager
              incomes={incomes}
              accounts={accounts}
              selectedMonth={selectedMonth}
              onAddIncome={handleAddIncome}
              onUpdateIncome={handleUpdateIncome}
              onDeleteIncome={handleDeleteIncome}
            />
          )}

          {activeTab === 'despesas' && (
            <ExpensesManager
              expenses={expenses}
              categories={categories}
              accounts={accounts}
              creditCards={creditCards}
              selectedMonth={selectedMonth}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'cartoes' && (
            <CreditCardsManager
              creditCards={creditCards}
              expenses={expenses}
              categories={categories}
              accounts={accounts}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'contas' && (
            <AccountsManager
              accounts={accounts}
              incomes={incomes}
              expenses={expenses}
              selectedMonth={selectedMonth}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'categorias' && (
            <CategoryManager
              categories={categories}
              expenses={expenses}
              selectedMonth={selectedMonth}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </main>
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
