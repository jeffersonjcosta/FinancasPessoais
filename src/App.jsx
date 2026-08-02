import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CreditCardsManager from './components/CreditCardsManager';
import FileImporter from './components/FileImporter';
import DebtsManager from './components/DebtsManager';
import Planning from './components/Planning';
import Settings from './components/Settings';
import {
  ShieldCheck,
  Calendar,
  LayoutDashboard,
  Receipt,
  CreditCard,
  UploadCloud,
  Landmark,
  SlidersHorizontal,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [profile, setProfile] = useState({
    monthly_income: 17922.56,
    limit_essentials: 8500,
    limit_lifestyle: 2500,
    limit_savings: 1000,
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('APP_TRANSACTIONS');
    return saved ? JSON.parse(saved) : [];
  });

  const [creditCards, setCreditCards] = useState(() => {
    const saved = localStorage.getItem('APP_CREDIT_CARDS');
    return saved ? JSON.parse(saved) : [
      { id: 'card-credicard', name: 'Credicard', limit_amount: 5000, closing_day: 15, due_day: 24, color: '#4f46e5' },
      { id: 'card-bradesco', name: 'Bradesco', limit_amount: 8000, closing_day: 15, due_day: 24, color: '#dc2626' }
    ];
  });

  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('APP_DEBTS');
    return saved ? JSON.parse(saved) : [
      { id: 'debt-suelena', creditor_name: 'Suelena', total_amount: 14000, remaining_amount: 12000, monthly_payment: 1000, notes: 'Empréstimo Familiar (R$ 1.000/mês)' }
    ];
  });

  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('APP_CUSTOM_CATEGORIES');
    return saved ? JSON.parse(saved) : [
      { id: 'cat-mercado', name: 'Alimentação / Mercado', macro_category: 'essentials', budget_limit: 2500 },
      { id: 'cat-gasolina', name: 'Transporte / Gasolina', macro_category: 'essentials', budget_limit: 600 },
      { id: 'cat-lazer', name: 'Lazer & Lanches', macro_category: 'lifestyle', budget_limit: 400 },
      { id: 'cat-outros', name: 'Outros Flexíveis', macro_category: 'lifestyle', budget_limit: 500 }
    ];
  });

  const [recurring, setRecurring] = useState([]);

  // Save state to localStorage as fallback
  useEffect(() => {
    localStorage.setItem('APP_TRANSACTIONS', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('APP_CREDIT_CARDS', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('APP_DEBTS', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('APP_CUSTOM_CATEGORIES', JSON.stringify(customCategories));
  }, [customCategories]);

  // Check Auth State
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

  // Fetch Data when user is logged in
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // 1. Profile
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profData) setProfile(profData);

      // 2. Transactions
      const { data: txData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txData && txData.length > 0) setTransactions(txData);

      // 3. Credit Cards
      const { data: cardData } = await supabase.from('credit_cards').select('*');
      if (cardData && cardData.length > 0) setCreditCards(cardData);

      // 4. Debts
      const { data: debtData } = await supabase.from('debts').select('*');
      if (debtData && debtData.length > 0) setDebts(debtData);

      // 5. Categories
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData && catData.length > 0) setCustomCategories(catData);

      // 6. Recurring
      const { data: recData } = await supabase.from('recurring_expenses').select('*');
      if (recData) setRecurring(recData);

    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    }
  };

  // Add Transaction
  const handleAddTransaction = async (newTx) => {
    const txObj = {
      ...newTx,
      id: newTx.id || 'tx-' + Date.now() + Math.random().toString(36).substr(2, 4),
      user_id: user?.id || 'demo-user',
    };

    setTransactions(prev => [txObj, ...prev]);

    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('transactions').insert([txObj]);
      } catch (err) {
        console.error('Erro ao inserir transação no Supabase:', err);
      }
    }
  };

  // Batch Import Transactions
  const handleBatchImport = async (txList) => {
    for (const tx of txList) {
      await handleAddTransaction(tx);
    }
  };

  // Update Transaction
  const handleUpdateTransaction = async (id, updatedFields) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('transactions').update(updatedFields).eq('id', id);
      } catch (err) {
        console.error('Erro ao atualizar transação no Supabase:', err);
      }
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar transação no Supabase:', err);
      }
    }
  };

  // Credit Card Handlers
  const handleAddCard = async (newCard) => {
    const cardObj = {
      ...newCard,
      id: 'card-' + Date.now(),
      user_id: user?.id || 'demo-user'
    };
    setCreditCards(prev => [...prev, cardObj]);

    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('credit_cards').insert([cardObj]);
      } catch (err) {
        console.error('Erro ao inserir cartão:', err);
      }
    }
  };

  const handleDeleteCard = async (id) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('credit_cards').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar cartão:', err);
      }
    }
  };

  // Debts Handlers
  const handleAddDebt = async (newDebt) => {
    const debtObj = {
      ...newDebt,
      id: 'debt-' + Date.now(),
      user_id: user?.id || 'demo-user'
    };
    setDebts(prev => [...prev, debtObj]);

    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('debts').insert([debtObj]);
      } catch (err) {
        console.error('Erro ao inserir dívida:', err);
      }
    }
  };

  const handleUpdateDebt = async (id, updatedFields) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updatedFields } : d));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('debts').update(updatedFields).eq('id', id);
      } catch (err) {
        console.error('Erro ao atualizar dívida:', err);
      }
    }
  };

  const handleDeleteDebt = async (id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('debts').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar dívida:', err);
      }
    }
  };

  // Profile Save
  const handleSaveProfile = async (updatedProfile) => {
    setProfile(prev => ({ ...prev, ...updatedProfile }));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update(updatedProfile).eq('id', user.id);
      } catch (err) {
        console.error('Erro ao salvar perfil:', err);
      }
    }
  };

  // Category Handlers
  const handleAddCategory = async (newCat) => {
    const catObj = {
      ...newCat,
      id: 'cat-' + Date.now(),
      user_id: user?.id || 'demo-user'
    };
    setCustomCategories(prev => [...prev, catObj]);

    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('categories').insert([catObj]);
      } catch (err) {
        console.error('Erro ao adicionar categoria:', err);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
    if (user && isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar categoria:', err);
      }
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
      <div className="auth-container" style={{ textAlign: 'center', alignItems: 'center' }}>
        <div className="app-logo-icon" style={{ animation: 'spin 1s linear infinite' }}>
          <ShieldCheck size={26} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando Semáforo Fin Responsivo...</p>
      </div>
    );
  }

  // If Supabase configured and user not logged in
  if (isSupabaseConfigured() && !user) {
    return <Auth onLoginSuccess={(u) => setUser(u)} />;
  }

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = monthNames[new Date().getMonth()];

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard Semáforo', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato de Transações', icon: Receipt },
    { id: 'cards', label: 'Cartões & Faturas', icon: CreditCard },
    { id: 'importer', label: 'Importar Extrato (OFX)', icon: UploadCloud },
    { id: 'debts', label: 'Empréstimos & Dívidas', icon: Landmark },
    { id: 'planning', label: 'Planejar Limites', icon: SlidersHorizontal },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <div className="app-container">
      {/* Desktop Left Sidebar */}
      <aside className="desktop-sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="app-logo-icon">
              <ShieldCheck size={22} />
            </div>
            <span className="app-title">SemáforoFin</span>
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

        {user && (
          <button
            className="sidebar-item"
            onClick={handleLogout}
            style={{ color: '#f87171', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        )}
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-title-area">
            <h1>Gestão Financeira Familiar</h1>
            <p>Sistema Web Responsivo integrado ao Supabase</p>
          </div>

          <div className="user-badge">
            <Calendar size={15} />
            <span>{currentMonthName} / {new Date().getFullYear()}</span>
          </div>
        </header>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard
              profile={profile}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              customCategories={customCategories}
              creditCards={creditCards}
              debts={debts}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              creditCards={creditCards}
            />
          )}

          {activeTab === 'cards' && (
            <CreditCardsManager
              creditCards={creditCards}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'importer' && (
            <FileImporter
              customCategories={customCategories}
              onBatchImport={handleBatchImport}
              creditCards={creditCards}
              existingTransactions={transactions}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsManager
              debts={debts}
              onAddDebt={handleAddDebt}
              onUpdateDebt={handleUpdateDebt}
              onDeleteDebt={handleDeleteDebt}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'planning' && (
            <Planning
              profile={profile}
              onSaveProfile={handleSaveProfile}
              recurring={recurring}
              onAddRecurring={(rec) => setRecurring(prev => [...prev, rec])}
              onDeleteRecurring={(id) => setRecurring(prev => prev.filter(r => r.id !== id))}
              customCategories={customCategories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              user={user}
              onLogout={handleLogout}
              transactions={transactions}
              profile={profile}
              recurring={recurring}
              onImportData={() => fetchUserData()}
            />
          )}
        </main>
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
