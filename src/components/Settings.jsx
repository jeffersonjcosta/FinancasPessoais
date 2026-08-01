import React, { useState } from 'react';
import { Download, Upload, LogOut, Key, Database, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function Settings({ user, onLogout, transactions, profile, recurring, onImportData }) {
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('CUSTOM_SUPABASE_URL') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '');
  const [keysSaved, setKeysSaved] = useState(false);

  const handleSaveKeys = (e) => {
    e.preventDefault();
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('CUSTOM_SUPABASE_URL', supabaseUrl.trim());
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', supabaseKey.trim());
      setKeysSaved(true);
      setTimeout(() => {
        setKeysSaved(false);
        window.location.reload();
      }, 1500);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userEmail: user?.email,
      profile,
      recurring,
      transactions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.transactions || parsed.profile) {
          await onImportData(parsed);
          alert('Dados importados com sucesso!');
        } else {
          alert('Formato de arquivo JSON inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Account Info */}
      <div className="glass-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.85rem' }}>Sua Conta</h2>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Conectado como: <strong style={{ color: 'var(--text-primary)' }}>{user?.email || 'Usuário'}</strong>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn-primary"
          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', boxShadow: 'none' }}
        >
          <LogOut size={18} /> Sair da Conta
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="glass-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Database size={18} /> Backup & Restauração Local
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
          Baixe uma cópia dos seus lançamentos em formato JSON para guardar em segurança no seu computador.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button type="button" onClick={handleExportJSON} className="btn-primary">
            <Download size={18} /> Exportar Backup (JSON)
          </button>

          <label className="btn-primary" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--card-border)', boxShadow: 'none', cursor: 'pointer' }}>
            <Upload size={18} /> Importar Backup (JSON)
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Dynamic Supabase Config */}
      <div className="glass-card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Key size={18} /> Configuração do Supabase
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Se não usou o arquivo <code>.env.local</code>, insira a URL e a Anon Key do seu projeto Supabase aqui:
        </p>

        {keysSaved && (
          <div className="traffic-message green" style={{ marginBottom: '0.85rem' }}>
            Chaves salvas! Recarregando...
          </div>
        )}

        <form onSubmit={handleSaveKeys} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project URL</label>
            <input
              type="text"
              className="input-glass"
              placeholder="https://xyz.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Anon Key</label>
            <input
              type="text"
              className="input-glass"
              placeholder="eyJhbGciOi..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.35rem' }}>
            <Check size={18} /> Salvar Chaves do Supabase
          </button>
        </form>
      </div>
    </div>
  );
}
