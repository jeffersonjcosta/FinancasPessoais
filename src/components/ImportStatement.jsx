import React, { useMemo, useRef, useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowLeft,
  Landmark, CreditCard, Trash2, Loader2, ClipboardPaste, Sparkles
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/finance';
import {
  guessCategory, looksLikeHtml, decodeText, gridFromHtml, gridFromSheet,
  parseGrid, parsePdfText, parseOfx, parsePastedText, applySignRule,
  buildCategoryMemory, normalizeDesc
} from '../utils/statementParsers';

// pdf.js entra por CDN só quando um PDF é escolhido: evita dependência nativa (canvas) no build.
const PDFJS_VERSION = '4.8.69';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise = null;
const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve, reject) => {
    const legacy = document.createElement('script');
    legacy.src = `${PDFJS_CDN}/pdf.min.js`;
    legacy.onload = () => {
      if (!window.pdfjsLib) return reject(new Error('pdf.js não carregou'));
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(window.pdfjsLib);
    };
    legacy.onerror = () => { pdfjsPromise = null; reject(new Error('Não foi possível baixar o leitor de PDF (precisa de internet)')); };
    document.head.appendChild(legacy);
  });
  return pdfjsPromise;
};

const pdfToText = async (file) => {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    // Reagrupa os fragmentos em linhas pela coordenada Y.
    const lines = new Map();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const bucket = lines.get(y) || [];
      bucket.push({ x: item.transform[4], str: item.str });
      lines.set(y, bucket);
    }
    const ordered = Array.from(lines.entries()).sort((a, b) => b[0] - a[0]);
    for (const [, bucket] of ordered) text += bucket.sort((a, b) => a.x - b.x).map(i => i.str).join(' ') + '\n';
  }
  return text;
};

// Preferências da última importação (conta e cartão usados).
const PREFS_KEY = 'FIN_IMPORT_PREFS';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignora */ } };

const dupKey = (date, value) => `${date}_${Math.round(Math.abs(value) * 100)}`;

export default function ImportStatement({
  categories = [], accounts = [], creditCards = [], incomes = [], expenses = [],
  selectedMonth, onImport, onNavigate
}) {
  const prefs = useMemo(loadPrefs, []);
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [onlyUncategorized, setOnlyUncategorized] = useState(false);
  const [target, setTarget] = useState('conta'); // 'conta' | 'cartao'
  const [accountId, setAccountId] = useState(
    (accounts.some(a => a.id === prefs.accountId) && prefs.accountId) ||
    accounts.find(a => a.type !== 'reserva')?.id || accounts[0]?.id || ''
  );
  const [cardId, setCardId] = useState(
    (creditCards.some(c => c.id === prefs.cardId) && prefs.cardId) || creditCards[0]?.id || ''
  );
  const inputRef = useRef(null);

  const memory = useMemo(() => buildCategoryMemory(expenses), [expenses]);
  const fallbackCat = categories.find(c => c.id === 'cat-outros')?.id || '';

  // Lançamentos já existentes, por data+valor, para marcar possível duplicata.
  const existingKeys = useMemo(() => {
    const keys = new Set();
    const add = (date, value) => { if (date && value) keys.add(dupKey(date, value)); };
    incomes.forEach(i => { add(i.date, i.actual_amount); add(i.date, i.predicted_amount); });
    expenses.forEach(e => { add(e.date, e.actual_amount); add(e.date, e.predicted_amount); });
    return keys;
  }, [incomes, expenses]);

  const buildRow = (parsed, index) => {
    const isIncome = !!parsed.isCredit;
    const matchedCard = parsed.cardFinal
      ? creditCards.find(c => (c.name || '').includes(parsed.cardFinal))
      : null;
    const duplicate = existingKeys.has(dupKey(parsed.date, parsed.amount));
    return {
      key: `${index}-${parsed.date}-${parsed.amount}`,
      include: !duplicate,
      duplicate,
      date: parsed.date,
      description: parsed.description,
      originalDescription: parsed.description,
      norm: normalizeDesc(parsed.description),
      amount: parsed.amount,
      signed: parsed.signed,
      type: isIncome ? 'receita' : 'despesa',
      typeTouched: false,
      category_id: guessCategory(parsed.description, categories, memory),
      catTouched: false,
      card_id: matchedCard?.id || '',
      cardFinal: parsed.cardFinal || '',
      installment_info: parsed.installment || '',
    };
  };

  const showRows = (parsed, label, mode) => {
    if (!parsed.length) {
      setError('Não encontrei lançamentos. Aceito extrato XLS/XLSX/CSV/OFX, fatura em PDF ou texto colado com "data descrição valor" por linha.');
      return;
    }
    setTarget(mode);
    setSource(label);
    setRows(applySignRule(parsed, mode).map(buildRow));
    // Fatura com um único final de cartão conhecido: já seleciona esse cartão.
    const finals = [...new Set(parsed.map(p => p.cardFinal).filter(Boolean))];
    const known = finals.map(f => creditCards.find(c => (c.name || '').includes(f))).filter(Boolean);
    if (known.length) setCardId(known[0].id);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setDone(null);
    setRows([]);
    setSource(file.name);
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'pdf') {
        const text = await pdfToText(file);
        const parsed = parsePdfText(text, selectedMonth);
        // PDF com cabeçalho de extrato bancário (saldo) é conta; o resto é fatura.
        const mode = /saldo|extrato/i.test(text.slice(0, 2000)) && !/fatura/i.test(text.slice(0, 2000)) ? 'conta' : 'cartao';
        showRows(parsed, file.name, mode);
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const asText = ['ofx', 'txt'].includes(ext) ? decodeText(bytes) : '';
        let parsed;
        if (/<STMTTRN>/i.test(asText)) parsed = parseOfx(asText, selectedMonth);
        else if (ext === 'txt') parsed = parsePastedText(asText, selectedMonth);
        else if (ext !== 'csv' && looksLikeHtml(bytes)) parsed = parseGrid(gridFromHtml(bytes), selectedMonth);
        else parsed = parseGrid(gridFromSheet(bytes), selectedMonth);
        showRows(parsed, file.name, 'conta');
      }
    } catch (err) {
      setError(`Falha ao ler o arquivo: ${err.message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePaste = () => {
    setError('');
    setDone(null);
    const looksCard = /fatura|cart[aã]o|final\s*\d{4}/i.test(pasteText);
    showRows(parsePastedText(pasteText, selectedMonth), 'texto colado', looksCard ? 'cartao' : 'conta');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // Troca conta/fatura: reinterpreta o sinal das linhas que o usuário não mexeu.
  const changeTarget = (mode) => {
    setTarget(mode);
    setRows(prev => {
      const recomputed = applySignRule(prev.map(r => ({ ...r, isCredit: r.type === 'receita' })), mode);
      return recomputed.map(r => (r.typeTouched || r.signed === undefined ? r : { ...r, type: r.isCredit ? 'receita' : 'despesa' }));
    });
  };

  const patch = (key, fields) => setRows(prev => prev.map(r => (r.key === key ? { ...r, ...fields } : r)));
  const removeRow = (key) => setRows(prev => prev.filter(r => r.key !== key));
  const setAllIncluded = (value) => setRows(prev => prev.map(r => ({ ...r, include: value })));

  // Escolher a categoria de uma linha aplica às outras do mesmo estabelecimento ainda não revisadas.
  const setCategory = (row, categoryId) => setRows(prev => prev.map(r => {
    if (r.key === row.key) return { ...r, category_id: categoryId, catTouched: true };
    if (!r.catTouched && row.norm && r.norm === row.norm) return { ...r, category_id: categoryId };
    return r;
  }));

  const selected = rows.filter(r => r.include);
  const totalIn = selected.filter(r => r.type === 'receita').reduce((s, r) => s + r.amount, 0);
  const totalOut = selected.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0);
  const uncategorized = rows.filter(r => r.include && r.type === 'despesa' && r.category_id === fallbackCat).length;
  const visibleRows = onlyUncategorized ? rows.filter(r => r.type === 'despesa' && r.category_id === fallbackCat) : rows;

  const handleImport = () => {
    if (!selected.length) return;
    const isCard = target === 'cartao';
    const payload = selected.map(r => {
      const base = {
        date: r.date,
        description: r.description.trim() || 'Lançamento importado',
        predicted_amount: r.amount,
        actual_amount: r.amount,
        status: 'ok',
        notes: `Importado de ${source}${r.originalDescription !== r.description ? ` • original: ${r.originalDescription}` : ''}`,
      };
      // Crédito numa fatura é estorno: abate da fatura, não é receita na conta.
      if (r.type === 'receita' && isCard) {
        return {
          kind: 'despesa',
          data: {
            ...base,
            description: `Estorno: ${base.description}`,
            predicted_amount: -r.amount,
            actual_amount: -r.amount,
            category_id: r.category_id || fallbackCat,
            account_id: accountId,
            payment_method: 'Cartão de Crédito',
            card_id: r.card_id || cardId,
          },
        };
      }
      if (r.type === 'receita') return { kind: 'receita', data: { ...base, account_id: accountId } };
      const categoryId = r.category_id || guessCategory(r.description, categories, memory);
      return {
        kind: 'despesa',
        data: {
          ...base,
          category_id: categoryId,
          account_id: accountId,
          payment_method: isCard ? 'Cartão de Crédito' : 'Débito / Pix',
          ...(isCard ? { card_id: r.card_id || cardId } : {}),
          ...(!isCard && categoryId === 'cat-cartoes' ? { is_invoice_payment: true } : {}),
          ...(r.installment_info ? { installment_info: r.installment_info } : {}),
        },
      };
    });
    onImport(payload);
    savePrefs({ accountId, cardId });
    setDone({ count: payload.length, source, isCard });
    setRows([]);
    setSource('');
    setPasteText('');
    setPasteOpen(false);
  };

  // ---------------------------------------------------------------- tela inicial
  if (!rows.length) {
    return (
      <div className="manager-container">
        <div className="section-header">
          <div>
            <h2>Importar lançamentos</h2>
            <p className="text-secondary">
              Arraste o extrato ou a fatura, ou cole o texto copiado do app do banco. O arquivo é lido
              no próprio navegador e você revisa tudo antes de salvar.
            </p>
          </div>
        </div>

        {error && (
          <div className="notice notice-error"><AlertTriangle size={16} /> {error}</div>
        )}
        {done && (
          <div className="notice notice-ok import-done">
            <span><CheckCircle2 size={16} /> {done.count} lançamento(s) importado(s) de {done.source}.</span>
            <span className="import-done-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.(done.isCard ? 'cartoes' : 'despesas')}>
                Ver {done.isCard ? 'fatura' : 'despesas'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate?.('dashboard')}>Ir para Home</button>
            </span>
          </div>
        )}

        <div
          className={`glass-card import-dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {busy ? (
            <>
              <Loader2 size={40} className="spin" />
              <h3>Lendo {source}…</h3>
            </>
          ) : (
            <>
              <UploadCloud size={40} />
              <h3>Arraste o arquivo aqui</h3>
              <p className="text-secondary">
                Extrato: XLS, XLSX, CSV ou OFX (Bradesco, Itaú, Nubank…). Fatura de cartão: PDF.
              </p>
              <div className="import-start-actions">
                <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
                  <FileText size={16} /> Escolher arquivo
                </button>
                <button className="btn btn-secondary" onClick={() => setPasteOpen(v => !v)}>
                  <ClipboardPaste size={16} /> Colar texto
                </button>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xls,.xlsx,.csv,.ofx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {pasteOpen && (
          <div className="glass-card import-paste">
            <label>Cole aqui as linhas copiadas do extrato ou da fatura</label>
            <textarea
              className="input-glass"
              rows={8}
              value={pasteText}
              autoFocus
              placeholder={'05/11 PADARIA PAO QUENTE 23,50\n06/11 POSTO SHELL 180,00\n07/11 PIX RECEBIDO FULANO 500,00'}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <p className="text-secondary">Uma linha por lançamento, com data, descrição e valor. No extrato, valor negativo é saída.</p>
            <button className="btn btn-primary" disabled={!pasteText.trim()} onClick={handlePaste}>
              <Sparkles size={16} /> Ler lançamentos
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- revisão
  return (
    <div className="manager-container">
      <div className="section-header">
        <div>
          <h2>Revisar antes de importar</h2>
          <p className="text-secondary">
            {rows.length} linha(s) de <strong>{source}</strong>. Categorias sugeridas com base no que
            você já lançou; ao escolher uma, as linhas do mesmo estabelecimento seguem junto.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setRows([]); setSource(''); }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Selecionados</span>
          <span className="metric-value">{selected.length} de {rows.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">{target === 'cartao' ? 'Estornos' : 'Entradas'}</span>
          <span className="metric-value text-income">{formatCurrency(totalIn)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Saídas</span>
          <span className="metric-value text-expense">{formatCurrency(totalOut)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Já existiam (desmarcados)</span>
          <span className="metric-value">{rows.filter(r => r.duplicate).length}</span>
        </div>
      </div>

      <div className="glass-card import-options">
        <div className="form-group">
          <label>Isto é</label>
          <div className="import-toggle">
            <button className={`btn ${target === 'conta' ? 'btn-primary' : 'btn-outline'}`} onClick={() => changeTarget('conta')}>
              <Landmark size={15} /> Extrato de conta
            </button>
            <button className={`btn ${target === 'cartao' ? 'btn-primary' : 'btn-outline'}`} onClick={() => changeTarget('cartao')}>
              <CreditCard size={15} /> Fatura de cartão
            </button>
          </div>
        </div>

        {target === 'cartao' ? (
          <div className="form-group">
            <label>Cartão</label>
            <select className="input-glass" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label>Conta</label>
            <select className="input-glass" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {uncategorized > 0 && (
          <label className="import-filter">
            <input type="checkbox" checked={onlyUncategorized} onChange={(e) => setOnlyUncategorized(e.target.checked)} />
            Mostrar só as {uncategorized} sem categoria ("Outros")
          </label>
        )}
      </div>

      <div className="card-table-container">
        <table className="data-table import-table">
          <thead>
            <tr>
              <th style={{ width: '2.5rem' }}>
                <input
                  type="checkbox"
                  checked={selected.length === rows.length}
                  onChange={(e) => setAllIncluded(e.target.checked)}
                  title="Marcar/desmarcar todos"
                />
              </th>
              <th style={{ width: '7.5rem' }}>Data</th>
              <th>Descrição</th>
              <th style={{ width: '8rem' }}>Valor</th>
              <th style={{ width: '7rem' }}>Tipo</th>
              <th style={{ width: '12rem' }}>Categoria</th>
              <th style={{ width: '3rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(r => (
              <tr key={r.key} className={r.include ? '' : 'row-excluded'}>
                <td data-label="">
                  <input type="checkbox" checked={r.include} onChange={(e) => patch(r.key, { include: e.target.checked })} />
                </td>
                <td data-label="Data">
                  <input className="input-glass input-compact" type="date" value={r.date} onChange={(e) => patch(r.key, { date: e.target.value })} />
                  {r.duplicate && <span className="badge badge-warning">já existe</span>}
                </td>
                <td data-label="Descrição">
                  <input
                    className="input-glass input-compact"
                    type="text"
                    value={r.description}
                    placeholder="Dê um nome a este lançamento"
                    onChange={(e) => patch(r.key, { description: e.target.value })}
                  />
                  {r.installment_info && <span className="badge badge-subtle">parcela {r.installment_info}</span>}
                  {r.cardFinal && <span className="badge badge-subtle">final {r.cardFinal}</span>}
                  {r.originalDescription !== r.description && (
                    <div className="text-secondary import-original">extrato: {r.originalDescription}</div>
                  )}
                </td>
                <td data-label="Valor">
                  <input
                    className="input-glass input-compact"
                    type="number"
                    step="0.01"
                    value={r.amount}
                    onChange={(e) => patch(r.key, { amount: Math.abs(Number(e.target.value) || 0) })}
                  />
                </td>
                <td data-label="Tipo">
                  <select
                    className="input-glass input-compact"
                    value={r.type}
                    onChange={(e) => patch(r.key, { type: e.target.value, typeTouched: true })}
                  >
                    <option value="despesa">Saída</option>
                    <option value="receita">{target === 'cartao' ? 'Estorno' : 'Entrada'}</option>
                  </select>
                </td>
                <td data-label="Categoria">
                  {r.type === 'despesa' ? (
                    <select
                      className={`input-glass input-compact ${r.category_id === fallbackCat ? 'cat-missing' : ''}`}
                      value={r.category_id}
                      onChange={(e) => setCategory(r, e.target.value)}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
                <td>
                  <button className="icon-btn icon-btn-danger" onClick={() => removeRow(r.key)} title="Descartar linha">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="import-footer">
        <span className="text-secondary">
          {selected.length} lançamento(s) serão criados
          {selected[0]?.date ? `, a partir de ${formatDateBR(selected[0].date)}` : ''}.
        </span>
        <button className="btn btn-primary" disabled={!selected.length} onClick={handleImport}>
          <CheckCircle2 size={16} /> Importar {selected.length} lançamento(s)
        </button>
      </div>
    </div>
  );
}
