import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncomesManager from './components/IncomesManager';
import ExpensesManager from './components/ExpensesManager';
import AccountsManager from './components/AccountsManager';
import CategoryManager from './components/CategoryManager';
import CreditCardsManager from './components/CreditCardsManager';
import ImportStatement from './components/ImportStatement';
import Settings from './components/Settings';
import { loadLocalState, saveLocalState, takeSnapshot, seedState } from './utils/storage';
import { fetchRemote, pushRemote, isMissingTable } from './utils/cloudSync';
import { currentMonth } from './utils/finance';
import {
  ShieldCheck,
  Calendar,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Landmark,
  Tag,
  CreditCard,
  UploadCloud,
  LogOut,
  DatabaseBackup,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import './App.css';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'importar', label: 'Importar', icon: UploadCloud },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp },
  { id: 'cartoes', label: 'Cartões', icon: CreditCard },
  { id: 'contas', label: 'Contas', icon: Landmark },
  { id: 'categorias', label: 'Categorias', icon: Tag },
  { id: 'dados', label: 'Backup', icon: DatabaseBackup },
];

const SYNC_LABEL = {
  off: 'Só neste aparelho',
  syncing: 'Sincronizando…',
  pending: 'Salvando na nuvem…',
  ok: 'Salvo na nuvem',
  error: 'Sem conexão — salvo no aparelho',
  'no-table': 'Nuvem não ativada',
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // ------------------------------------------------------------ dados
  const [data, setData] = useState(loadLocalState);
  const dataRef = useRef(data);
  dataRef.current = data;
  const { accounts, categories, incomes, expenses, creditCards } = data;

  useEffect(() => { saveLocalState(data); }, [data]);

  const mutate = (field) => (updater) => setData(prev => ({
    ...prev,
    [field]: typeof updater === 'function' ? updater(prev[field]) : updater,
    updated_at: Date.now(),
  }));
  const setAccounts = mutate('accounts');
  const setCategories = mutate('categories');
  const setIncomes = mutate('incomes');
  const setExpenses = mutate('expenses');
  const setCreditCards = mutate('creditCards');

  // Troca todos os dados de uma vez (backup, nuvem, seed), sempre guardando cópia do que havia.
  const replaceAll = (next, reason) => {
    takeSnapshot(dataRef.current, reason);
    setData({ ...next, updated_at: Date.now() });
  };

  // ------------------------------------------------------------ nuvem
  const [syncStatus, setSyncStatus] = useState('off');
  const [lastSync, setLastSync] = useState(null);
  const remoteReady = useRef(false);
  const lastPushed = useRef(null);
  const userId = user && !user.isLocal ? user.id : null;

  const syncNow = useCallback(async () => {
    if (!userId) return;
    setSyncStatus('syncing');
    try {
      const remote = await fetchRemote(userId);
      const local = dataRef.current;
      const localAt = local.updated_at || 0;
      if (remote && remote.updated_at > localAt) {
        takeSnapshot(local, 'antes de baixar da nuvem');
        lastPushed.current = remote.updated_at;
        setData(remote);
      } else if (!remote || localAt > remote.updated_at) {
        const toPush = localAt ? local : { ...local, updated_at: Date.now() };
        await pushRemote(userId, toPush);
        lastPushed.current = toPush.updated_at;
        if (!localAt) setData(toPush);
      } else {
        lastPushed.current = localAt;
      }
      remoteReady.current = true;
      setSyncStatus('ok');
      setLastSync(Date.now());
    } catch (err) {
      console.error('[Financas] sync', err);
      setSyncStatus(isMissingTable(err) ? 'no-table' : 'error');
    }
  }, [userId]);

  // Ao entrar e sempre que o app volta para a frente (troca de aparelho).
  useEffect(() => {
    if (!userId) { remoteReady.current = false; setSyncStatus('off'); return; }
    syncNow();
    const onVisible = () => { if (document.visibilityState === 'visible') syncNow(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, syncNow]);

  // Cada alteração sobe para a nuvem 1,5 s depois da última edição.
  useEffect(() => {
    if (!userId || !remoteReady.current) return;
    if ((data.updated_at || 0) === lastPushed.current) return;
    setSyncStatus('pending');
    const t = setTimeout(async () => {
      try {
        await pushRemote(userId, data);
        lastPushed.current = data.updated_at;
        setSyncStatus('ok');
        setLastSync(Date.now());
      } catch (err) {
        setSyncStatus(isMissingTable(err) ? 'no-table' : 'error');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [data, userId]);

  // ------------------------------------------------------------ auth
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoadingAuth(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    }).catch(() => setLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------------------------------------------ handlers
  const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const handleAddCard = (newCard) => setCreditCards(prev => [...prev, { ...newCard, id: newId('card') }]);
  const handleUpdateCard = (cardId, fields) => setCreditCards(prev => prev.map(c => c.id === cardId ? { ...c, ...fields } : c));
  const handleDeleteCard = (cardId) => setCreditCards(prev => prev.filter(c => c.id !== cardId));

  const handleAddIncome = (newInc) => setIncomes(prev => [{ ...newInc, id: newId('inc') }, ...prev]);
  const handleUpdateIncome = (id, fields) => setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));
  const handleDeleteIncome = (id) => setIncomes(prev => prev.filter(i => i.id !== id));

  const handleAddExpense = (newExp) => setExpenses(prev => [{ ...newExp, id: newId('exp') }, ...prev]);
  const handleUpdateExpense = (id, fields) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));
  const handleDeleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  // Importação: uma única atualização por tipo, com ids únicos.
  const handleImportBatch = (entries) => {
    takeSnapshot(dataRef.current, 'antes de importar extrato');
    const stamp = Date.now();
    const newIncomes = [];
    const newExpenses = [];
    entries.forEach((entry, idx) => {
      if (entry.kind === 'receita') newIncomes.push({ ...entry.data, id: `inc-imp-${stamp}-${idx}` });
      else newExpenses.push({ ...entry.data, id: `exp-imp-${stamp}-${idx}` });
    });
    if (newIncomes.length) setIncomes(prev => [...newIncomes, ...prev]);
    if (newExpenses.length) setExpenses(prev => [...newExpenses, ...prev]);
  };

  const handleAddAccount = (newAcc) => setAccounts(prev => [...prev, { ...newAcc, id: newId('acc') }]);
  const handleUpdateAccount = (id, fields) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...fields } : a));
  const handleDeleteAccount = (id) => setAccounts(prev => prev.filter(a => a.id !== id));

  const handleAddCategory = (newCat) => setCategories(prev => [...prev, { ...newCat, id: newId('cat') }]);
  const handleUpdateCategory = (id, fields) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  const handleDeleteCategory = (id) => setCategories(prev => prev.filter(c => c.id !== id));

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
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

  if (!user) {
    return (
      <Auth
        onLoginSuccess={(u) => setUser(u)}
        onUseLocalMode={() => setUser({ email: 'Usuário Local (Offline)', isLocal: true })}
      />
    );
  }

  const SyncIcon = syncStatus === 'ok' ? Cloud : syncStatus === 'syncing' || syncStatus === 'pending' ? RefreshCw : CloudOff;
  const syncPill = (
    <button
      className={`sync-pill sync-${syncStatus}`}
      onClick={() => (syncStatus === 'no-table' || syncStatus === 'off' ? setActiveTab('dados') : syncNow())}
      title={lastSync ? `Última sincronização: ${new Date(lastSync).toLocaleTimeString('pt-BR')}` : 'Clique para sincronizar'}
    >
      <SyncIcon size={14} className={syncStatus === 'syncing' ? 'spin' : ''} />
      <span>{SYNC_LABEL[syncStatus]}</span>
    </button>
  );

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
              <span className="app-title">Finanças</span>
              <span className="app-subtitle">Gestão Pessoal Simples</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
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
          {syncPill}
          <button className="sidebar-item btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="app-header">
          <div className="header-title-area">
            <h1>Controle Financeiro Familiar</h1>
            <p>Contas, Receitas, Despesas & Cartões</p>
          </div>

          <div className="header-actions">
            <div className="mobile-only">{syncPill}</div>
            <label className="header-month-badge">
              <Calendar size={15} />
              <input
                type="month"
                className="month-input"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              />
            </label>
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
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateCard={handleUpdateCard}
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

          {activeTab === 'importar' && (
            <ImportStatement
              categories={categories}
              accounts={accounts}
              creditCards={creditCards}
              incomes={incomes}
              expenses={expenses}
              selectedMonth={selectedMonth}
              onImport={handleImportBatch}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'dados' && (
            <Settings
              data={data}
              user={user}
              syncStatus={syncStatus}
              syncLabel={SYNC_LABEL[syncStatus]}
              lastSync={lastSync}
              onSyncNow={syncNow}
              onReplaceAll={replaceAll}
              onResetToSeed={() => replaceAll(seedState(), 'antes de restaurar a planilha')}
            />
          )}
        </main>
      </div>

      <Navbar items={NAV_ITEMS} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
