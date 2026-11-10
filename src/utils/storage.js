// Persistência local: um único documento com todos os dados, mais cópias de segurança automáticas.
// O seed (initialData.js) só entra no PRIMEIRO uso. Nada mais sobrescreve os dados do usuário sem
// antes guardar uma cópia.
import {
  INITIAL_ACCOUNTS, INITIAL_CREDIT_CARDS, INITIAL_CATEGORIES, INITIAL_INCOMES, INITIAL_EXPENSES
} from '../data/initialData';

export const STATE_KEY = 'FIN_STATE_V1';
const SNAPSHOTS_KEY = 'FIN_SNAPSHOTS';
const MAX_SNAPSHOTS = 8;
const LEGACY_KEYS = {
  accounts: 'FIN_ACCOUNTS',
  categories: 'FIN_CATEGORIES',
  incomes: 'FIN_INCOMES',
  expenses: 'FIN_EXPENSES',
  creditCards: 'FIN_CREDIT_CARDS',
};

export const DATA_FIELDS = ['accounts', 'categories', 'incomes', 'expenses', 'creditCards'];

export const seedState = () => ({
  accounts: INITIAL_ACCOUNTS,
  categories: INITIAL_CATEGORIES,
  incomes: INITIAL_INCOMES,
  expenses: INITIAL_EXPENSES,
  creditCards: INITIAL_CREDIT_CARDS,
  updated_at: 0,
});

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isValidState = (s) =>
  Boolean(s && typeof s === 'object' && DATA_FIELDS.every(f => Array.isArray(s[f])));

// Ordem: documento novo -> chaves antigas (versões anteriores do app) -> seed.
export const loadLocalState = () => {
  const saved = readJSON(STATE_KEY);
  if (isValidState(saved)) return saved;

  const legacy = {};
  let found = false;
  for (const [field, key] of Object.entries(LEGACY_KEYS)) {
    const v = readJSON(key);
    if (Array.isArray(v)) { legacy[field] = v; found = true; }
  }
  if (found) return { ...seedState(), ...legacy, updated_at: Date.now() };
  return seedState();
};

export const saveLocalState = (state) => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[Financas] falha ao salvar localmente', err);
  }
};

// ---------------------------------------------------------------- cópias de segurança
export const listSnapshots = () => readJSON(SNAPSHOTS_KEY) || [];

export const takeSnapshot = (state, reason) => {
  if (!isValidState(state)) return;
  const snaps = listSnapshots();
  snaps.unshift({
    at: Date.now(),
    reason,
    counts: { incomes: state.incomes.length, expenses: state.expenses.length },
    state,
  });
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snaps.slice(0, MAX_SNAPSHOTS)));
  } catch {
    // Cota estourada: mantém só as mais recentes.
    try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snaps.slice(0, 2))); } catch { /* sem espaço */ }
  }
};

// ---------------------------------------------------------------- arquivo de backup
export const downloadBackup = (state) => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const blob = new Blob(
    [JSON.stringify({ app: 'financas-pessoais', version: 1, exported_at: new Date().toISOString(), ...state }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const parseBackupFile = async (file) => {
  const data = JSON.parse(await file.text());
  if (!isValidState(data)) throw new Error('Arquivo não é um backup deste app.');
  const state = {};
  DATA_FIELDS.forEach(f => { state[f] = data[f]; });
  return state;
};
