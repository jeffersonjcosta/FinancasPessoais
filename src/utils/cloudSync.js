// Sincronização na nuvem: um documento JSON por usuário na tabela public.user_data (ver supabase_schema.sql).
// Regra simples: vence a versão com updated_at mais recente. Antes de trocar os dados locais pelos da
// nuvem, o app guarda uma cópia de segurança (storage.takeSnapshot).
import { supabase } from '../supabaseClient';
import { DATA_FIELDS, isValidState } from './storage';

const TABLE = 'user_data';

export const pickData = (state) => {
  const out = { updated_at: state.updated_at || 0 };
  DATA_FIELDS.forEach(f => { out[f] = state[f]; });
  return out;
};

// Erro de tabela inexistente: o usuário ainda não rodou o SQL no Supabase.
export const isMissingTable = (error) =>
  Boolean(error && (error.code === '42P01' || error.code === 'PGRST205' || /user_data/.test(error.message || '')));

export const fetchRemote = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isValidState(data.data)) return null;
  return { ...data.data, updated_at: data.data.updated_at || new Date(data.updated_at).getTime() };
};

export const pushRemote = async (userId, state) => {
  const payload = pickData(state);
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: payload, updated_at: new Date(payload.updated_at || Date.now()).toISOString() });
  if (error) throw error;
};
