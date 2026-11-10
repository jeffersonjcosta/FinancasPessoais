import React, { useRef, useState } from 'react';
import {
  Cloud, CloudOff, RefreshCw, Download, Upload, History, Eraser, RotateCcw, Copy, Check, AlertTriangle
} from 'lucide-react';
import { downloadBackup, parseBackupFile, listSnapshots } from '../utils/storage';
import SYNC_SQL from '../../supabase_user_data.sql?raw';

const fmtDateTime = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function Settings({
  data, user, syncStatus, syncLabel, lastSync, onSyncNow, onReplaceAll, onResetToSeed
}) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [snapshots, setSnapshots] = useState(listSnapshots);
  const isLocal = !user || user.isLocal;

  const flash = (type, text) => setMsg({ type, text });
  const refreshSnaps = () => setTimeout(() => setSnapshots(listSnapshots()), 50);

  const handleRestoreFile = async (file) => {
    if (!file) return;
    try {
      const state = await parseBackupFile(file);
      const n = state.incomes.length + state.expenses.length;
      if (!window.confirm(`Restaurar o backup "${file.name}" (${n} lançamentos)? Os dados atuais serão substituídos — uma cópia deles fica guardada abaixo.`)) return;
      onReplaceAll(state, 'antes de restaurar backup');
      flash('ok', `Backup restaurado: ${n} lançamentos.`);
      refreshSnaps();
    } catch (err) {
      flash('error', err.message || 'Arquivo inválido.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRestoreSnapshot = (snap) => {
    if (!window.confirm(`Voltar para a cópia de ${fmtDateTime(snap.at)} (${snap.reason})?`)) return;
    onReplaceAll(snap.state, 'antes de voltar uma cópia automática');
    flash('ok', 'Cópia restaurada.');
    refreshSnaps();
  };

  const handleStartFresh = () => {
    if (!window.confirm('Apagar TODAS as receitas e despesas e começar do zero? Contas, cartões e categorias continuam. Uma cópia do que existe hoje fica guardada.')) return;
    onReplaceAll({ ...data, incomes: [], expenses: [] }, 'antes de começar do zero');
    flash('ok', 'Pronto: lançamentos zerados. Contas, cartões e categorias mantidos.');
    refreshSnaps();
  };

  const handleSeed = () => {
    if (!window.confirm('Voltar aos dados de exemplo da planilha FINANCEIRO 2026? Os dados atuais serão substituídos (fica uma cópia).')) return;
    onResetToSeed();
    flash('ok', 'Dados da planilha restaurados.');
    refreshSnaps();
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SYNC_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      flash('error', 'Não consegui copiar. Selecione o texto e copie manualmente.');
    }
  };

  return (
    <div className="manager-container settings-page">
      <div className="section-header">
        <div>
          <h2>Backup e sincronização</h2>
          <p className="text-secondary">
            {data.incomes.length} receitas • {data.expenses.length} despesas • {data.accounts.length} contas • {data.creditCards.length} cartões
          </p>
        </div>
      </div>

      {msg && (
        <div className={`notice notice-${msg.type}`}>
          {msg.type === 'ok' ? <Check size={16} /> : <AlertTriangle size={16} />} {msg.text}
        </div>
      )}

      {/* Nuvem */}
      <div className="glass-card settings-block">
        <h3>{syncStatus === 'ok' ? <Cloud size={18} /> : <CloudOff size={18} />} Nuvem (celular e computador juntos)</h3>
        {isLocal ? (
          <p className="text-secondary">
            Você entrou no modo offline: os dados ficam só neste navegador. Saia e entre com seu e-mail
            para sincronizar entre aparelhos.
          </p>
        ) : (
          <>
            <p>
              Status: <strong>{syncLabel}</strong>
              {lastSync && <span className="text-secondary"> — última vez às {new Date(lastSync).toLocaleTimeString('pt-BR')}</span>}
            </p>
            {syncStatus === 'no-table' && (
              <div className="settings-sql">
                <p>
                  Falta um passo, feito uma vez só: abra o <strong>Supabase → SQL Editor</strong> do projeto,
                  cole o comando abaixo e clique em <strong>Run</strong>. Depois toque em "Sincronizar agora".
                </p>
                <pre>{SYNC_SQL}</pre>
                <button className="btn btn-secondary" onClick={copySql}>
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copiado' : 'Copiar comando'}
                </button>
              </div>
            )}
            <button className="btn btn-primary" onClick={onSyncNow} disabled={syncStatus === 'syncing'}>
              <RefreshCw size={15} className={syncStatus === 'syncing' ? 'spin' : ''} /> Sincronizar agora
            </button>
          </>
        )}
      </div>

      {/* Arquivo */}
      <div className="glass-card settings-block">
        <h3><Download size={18} /> Backup em arquivo</h3>
        <p className="text-secondary">Baixe um arquivo com tudo (guarde no Drive). Serve também para levar os dados a outro aparelho.</p>
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={() => downloadBackup(data)}>
            <Download size={15} /> Baixar backup
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Restaurar de um arquivo
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => handleRestoreFile(e.target.files?.[0])} />
        </div>
      </div>

      {/* Cópias automáticas */}
      <div className="glass-card settings-block">
        <h3><History size={18} /> Cópias automáticas</h3>
        <p className="text-secondary">O app guarda uma cópia antes de cada importação, restauração ou troca pela versão da nuvem.</p>
        {snapshots.length === 0 ? (
          <p className="text-secondary">Nenhuma cópia ainda.</p>
        ) : (
          <ul className="snapshot-list">
            {snapshots.map(s => (
              <li key={s.at}>
                <span>
                  <strong>{fmtDateTime(s.at)}</strong> — {s.reason}
                  <span className="text-secondary"> ({s.counts.incomes} receitas, {s.counts.expenses} despesas)</span>
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => handleRestoreSnapshot(s)}>Voltar para esta</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zerar */}
      <div className="glass-card settings-block settings-danger">
        <h3><Eraser size={18} /> Recomeçar</h3>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleStartFresh}>
            <Eraser size={15} /> Começar do zero (mantém contas, cartões e categorias)
          </button>
          <button className="btn btn-outline" onClick={handleSeed}>
            <RotateCcw size={15} /> Voltar aos dados da planilha
          </button>
        </div>
      </div>
    </div>
  );
}
