import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ShieldCheck, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured()) {
      setErrorMsg('O Supabase ainda não foi configurado! Configure as chaves nas variáveis de ambiente ou na tela de Ajustes.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data?.user) {
          onLoginSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setInfoMsg('Cadastro realizado! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada, caso contrário, faça login.');
        setIsLogin(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao realizar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="app-logo-icon" style={{ width: '48px', height: '48px', margin: '0 auto' }}>
          <ShieldCheck size={28} />
        </div>
        <h1>Semáforo Financeiro</h1>
        <p>Acesse sua conta segura em nuvem para acompanhar seus limites diários e frear gastos excedentes.</p>
      </div>

      {!isSupabaseConfigured() && (
        <div className="traffic-message red" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Atenção: Supabase Não Configurado!</strong>
            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Para usar com Supabase, adicione as chaves no <code>.env.local</code> ou no script de tabelas.
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="traffic-message red">
          {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div className="traffic-message green">
          {infoMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
          {isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}
        </h2>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>E-mail</label>
          <input
            type="email"
            className="input-glass"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Senha</label>
          <input
            type="password"
            className="input-glass"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? (
            'Processando...'
          ) : isLogin ? (
            <>
              <LogIn size={18} /> Entrar
            </>
          ) : (
            <>
              <UserPlus size={18} /> Cadastrar
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setInfoMsg(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-indigo)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </form>
    </div>
  );
}
