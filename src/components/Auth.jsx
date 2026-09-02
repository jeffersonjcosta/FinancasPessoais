import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../supabaseClient';
import { ShieldCheck, LogIn, UserPlus, AlertCircle, Settings, HardDrive, Key, Check } from 'lucide-react';

export default function Auth({ onLoginSuccess, onUseLocalMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(localStorage.getItem('CUSTOM_SUPABASE_URL') || currentConfig.supabaseUrl || '');
  const [customKey, setCustomKey] = useState(localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || currentConfig.supabaseAnonKey || '');
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured()) {
      setErrorMsg('O Supabase ainda não foi configurado! Insira as chaves do seu projeto abaixo.');
      setLoading(false);
      setShowConfig(true);
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
        setInfoMsg('Cadastro realizado com sucesso! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada, caso contrário faça login.');
        setIsLogin(true);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
        setErrorMsg('Falha na conexão com o Supabase (Failed to fetch). O endereço do projeto está inacessível ou incorreto. Ajuste suas chaves abaixo ou use o Modo Local.');
        setShowConfig(true);
      } else {
        setErrorMsg(msg || 'Erro ao realizar autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (customUrl && customKey) {
      localStorage.setItem('CUSTOM_SUPABASE_URL', customUrl.trim());
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', customKey.trim());
      setConfigSavedMsg('Chaves salvas com sucesso! Recarregando conexão...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <div className="app-logo-icon auth-logo">
            <ShieldCheck size={32} />
          </div>
          <h1>Semáforo Financeiro</h1>
          <p>Acesse sua conta em nuvem ou utilize o modo local para controlar seus limites de gastos.</p>
        </div>

        {errorMsg && (
          <div className="traffic-message red">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Atenção:</strong>
              <div style={{ marginTop: '0.25rem', lineHeight: '1.4' }}>{errorMsg}</div>
            </div>
          </div>
        )}

        {infoMsg && (
          <div className="traffic-message green">
            <Check size={20} style={{ flexShrink: 0 }} />
            <div>{infoMsg}</div>
          </div>
        )}

        <form onSubmit={handleAuth} className="glass-card auth-card">
          <h2>{isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}</h2>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              className="input-glass"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
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

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              'Conectando...'
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

          <div className="auth-card-footer">
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setInfoMsg(''); }}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </form>

        <div className="auth-options-container">
          {onUseLocalMode && (
            <button
              type="button"
              className="btn btn-secondary auth-local-btn"
              onClick={onUseLocalMode}
            >
              <HardDrive size={18} /> Continuar sem Login (Modo Local)
            </button>
          )}

          <button
            type="button"
            className="auth-config-toggle-btn"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings size={16} /> {showConfig ? 'Ocultar Configuração do Supabase' : 'Configurar Chaves do Supabase'}
          </button>

          {showConfig && (
            <form onSubmit={handleSaveConfig} className="glass-card auth-config-card">
              <h3>
                <Key size={16} /> Chaves de Conexão Supabase
              </h3>
              <p className="auth-config-help">
                Insira a URL e a Anon Key do seu projeto no Supabase para sincronização em nuvem.
              </p>

              {configSavedMsg && (
                <div className="traffic-message green" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                  {configSavedMsg}
                </div>
              )}

              <div className="form-group">
                <label>URL do Projeto Supabase</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="https://xyz.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Anon Key (Chave Pública)</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="eyJhbGciOi..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Check size={16} /> Salvar e Reconectar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

