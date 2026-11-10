import React, { useMemo, useRef, useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowLeft,
  Landmark, CreditCard, Trash2, Loader2
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/finance';
import {
  guessCategory, looksLikeHtml, decodeText, gridFromHtml, gridFromSheet,
  parseGrid, parsePdfText, parseOfx
} from '../utils/statementParsers';

// pdf.js entra por CDN só quando um PDF é escolhido: evita dependência nativa (canvas) no build.
const PDFJS_VERSION = '4.8.69';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise = null;
const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve, reject) => {
    // Bundle clássico (UMD): popula window.pdfjsLib. O .mjs exigiria import dinâmico do CDN.
    const legacy = document.createElement('script');
    legacy.src = `${PDFJS_CDN}/pdf.min.js`;
    legacy.onload = () => {
      if (!window.pdfjsLib) return reject(new Error('pdf.js não carregou'));
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(window.pdfjsLib);
    };
    legacy.onerror = () => reject(new Error('Não foi possível baixar o pdf.js (precisa de internet)'));
    document.head.appendChild(legacy);
  });
  return pdfjsPromise;
};

// ---------------------------------------------------------------- componente
export default function ImportStatement({
  categories = [], accounts = [], creditCards = [], incomes = [], expenses = [],
  selectedMonth = '2026-09', onImport
}) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [target, setTarget] = useState('conta'); // 'conta' | 'cartao'
  const [accountId, setAccountId] = useState(accounts.find(a => a.type !== 'reserva')?.id || accounts[0]?.id || '');
  const [cardId, setCardId] = useState(creditCards[0]?.id || '');
  const inputRef = useRef(null);

  // Lançamentos já existentes, por data+valor, para marcar possível duplicata.
  const existingKeys = useMemo(() => {
    const keys = new Set();
    const add = (date, value) => { if (date && value) keys.add(`${date}_${Math.round(value * 100)}`); };
    incomes.forEach(i => { add(i.date, i.actual_amount); add(i.date, i.predicted_amount); });
    expenses.forEach(e => { add(e.date, e.actual_amount); add(e.date, e.predicted_amount); });
    return keys;
  }, [incomes, expenses]);

  const buildRow = (parsed, index) => {
    const isIncome = !!parsed.isCredit;
    const cardFinal = parsed.cardFinal || '';
    const matchedCard = cardFinal
      ? creditCards.find(c => (c.name || '').includes(cardFinal))
      : null;
    return {
      key: `${index}-${parsed.date}-${parsed.amount}`,
      include: !existingKeys.has(`${parsed.date}_${Math.round(parsed.amount * 100)}`),
      duplicate: existingKeys.has(`${parsed.date}_${Math.round(parsed.amount * 100)}`),
      date: parsed.date,
      description: parsed.description,
      originalDescription: parsed.description,
      amount: parsed.amount,
      type: isIncome ? 'receita' : 'despesa',
      category_id: isIncome ? '' : guessCategory(parsed.description, categories),
      card_id: matchedCard?.id || '',
      installment_info: parsed.installment || '',
    };
  };

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setDone('');
    setRows([]);
    setFileName(file.name);
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let parsed = [];

      if (ext === 'pdf') {
        const pdfjs = await loadPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        let text = '';
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
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
          for (const [, bucket] of ordered) {
            text += bucket.sort((a, b) => a.x - b.x).map(i => i.str).join(' ') + '\n';
          }
        }
        parsed = parsePdfText(text, selectedMonth);
        if (parsed.length) setTarget('cartao');
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const asText = ext === 'ofx' || ext === 'txt' ? decodeText(bytes) : '';
        if (/<STMTTRN>/i.test(asText)) {
          parsed = parseOfx(asText, selectedMonth);
        } else if (ext === 'csv') {
          parsed = parseGrid(gridFromSheet(bytes), selectedMonth);
        } else if (looksLikeHtml(bytes)) {
          parsed = parseGrid(gridFromHtml(bytes), selectedMonth);
        } else {
          parsed = parseGrid(gridFromSheet(bytes), selectedMonth);
        }
      }

      if (!parsed.length) {
        setError('Não encontrei lançamentos neste arquivo. Formatos aceitos: extrato XLS/XLSX/CSV/OFX do banco e fatura de cartão em PDF.');
      } else {
        setRows(parsed.map(buildRow));
      }
    } catch (err) {
      setError(`Falha ao ler o arquivo: ${err.message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const patch = (key, fields) => setRows(prev => prev.map(r => (r.key === key ? { ...r, ...fields } : r)));
  const removeRow = (key) => setRows(prev => prev.filter(r => r.key !== key));
  const setAllIncluded = (value) => setRows(prev => prev.map(r => ({ ...r, include: value })));

  const selected = rows.filter(r => r.include);
  const totalIn = selected.filter(r => r.type === 'receita').reduce((s, r) => s + r.amount, 0);
  const totalOut = selected.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0);
  const missingName = selected.filter(r => !r.description.trim()).length;

  const handleImport = () => {
    if (!selected.length) return;
    const payload = selected.map(r => {
      const base = {
        date: r.date,
        description: r.description.trim() || 'Lançamento importado',
        predicted_amount: r.amount,
        actual_amount: r.amount,
        status: 'ok',
        notes: `Importado de ${fileName}${r.originalDescription !== r.description ? ` • original: ${r.originalDescription}` : ''}`,
      };
      if (r.type === 'receita') {
        return { kind: 'receita', data: { ...base, account_id: target === 'conta' ? accountId : accountId } };
      }
      const isCard = target === 'cartao';
      return {
        kind: 'despesa',
        data: {
          ...base,
          category_id: r.category_id || guessCategory(r.description, categories),
          account_id: accountId,
          payment_method: isCard ? 'Cartão de Crédito' : 'Débito / Pix',
          ...(isCard ? { card_id: r.card_id || cardId } : {}),
          ...(r.installment_info ? { installment_info: r.installment_info } : {}),
        },
      };
    });
    onImport(payload);
    setDone(`${payload.length} lançamento(s) importado(s) de ${fileName}.`);
    setRows([]);
    setFileName('');
  };

  // ---------------------------------------------------------------- render
  if (!rows.length) {
    return (
      <div className="manager-container">
        <div className="section-header">
          <div>
            <h2>Importar Extrato</h2>
            <p className="text-secondary">
              Extrato do banco (XLS, XLSX, CSV, OFX) ou fatura de cartão (PDF). Nada é enviado para a
              internet: o arquivo é lido dentro do navegador e você revisa tudo antes de importar.
            </p>
          </div>
        </div>

        {error && (
          <div className="glass-card" style={{ borderColor: 'var(--danger, #dc2626)', marginBottom: '1rem' }}>
            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}
        {done && (
          <div className="glass-card" style={{ borderColor: 'var(--success, #16a34a)', marginBottom: '1rem' }}>
            <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            {done}
          </div>
        )}

        <div className="glass-card import-dropzone">
          {busy ? (
            <>
              <Loader2 size={40} className="spin" />
              <h3>Lendo {fileName}…</h3>
            </>
          ) : (
            <>
              <UploadCloud size={40} />
              <h3>Escolha o arquivo do extrato ou da fatura</h3>
              <p className="text-secondary">
                Bradesco exporta o extrato em XLS. A fatura do Itaú vem em PDF.
              </p>
              <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
                <FileText size={16} /> Selecionar arquivo
              </button>
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
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="section-header">
        <div>
          <h2>Revisar antes de importar</h2>
          <p className="text-secondary">
            {rows.length} linha(s) lida(s) de <strong>{fileName}</strong>. Corrija a descrição e o valor,
            escolha a categoria e desmarque o que não quer trazer.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setRows([]); setFileName(''); }}>
          <ArrowLeft size={16} /> Trocar arquivo
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Selecionados</span>
          <span className="metric-value">{selected.length} de {rows.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Entradas</span>
          <span className="metric-value text-income">{formatCurrency(totalIn)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Saídas</span>
          <span className="metric-value text-expense">{formatCurrency(totalOut)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Possíveis duplicatas</span>
          <span className="metric-value">{rows.filter(r => r.duplicate).length}</span>
        </div>
      </div>

      <div className="glass-card import-options">
        <div className="form-group">
          <label>Origem dos lançamentos</label>
          <div className="import-toggle">
            <button
              className={`btn ${target === 'conta' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTarget('conta')}
            >
              <Landmark size={15} /> Extrato de conta
            </button>
            <button
              className={`btn ${target === 'cartao' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTarget('cartao')}
            >
              <CreditCard size={15} /> Fatura de cartão
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Conta {target === 'cartao' ? '(pagamento da fatura sai dela)' : ''}</label>
          <select className="input-glass" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {target === 'cartao' && (
          <div className="form-group">
            <label>Cartão (usado quando a linha não traz o final)</label>
            <select className="input-glass" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
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
              <th>Descrição (revise e renomeie)</th>
              <th style={{ width: '8rem' }}>Valor</th>
              <th style={{ width: '7rem' }}>Tipo</th>
              <th style={{ width: '12rem' }}>Categoria</th>
              <th style={{ width: '3rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} className={r.include ? '' : 'row-excluded'}>
                <td>
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => patch(r.key, { include: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    className="input-glass input-compact"
                    type="date"
                    value={r.date}
                    onChange={(e) => patch(r.key, { date: e.target.value })}
                  />
                  {r.duplicate && <span className="badge badge-warning">já existe</span>}
                </td>
                <td>
                  <input
                    className="input-glass input-compact"
                    type="text"
                    value={r.description}
                    placeholder="Dê um nome a este lançamento"
                    onChange={(e) => patch(r.key, { description: e.target.value })}
                  />
                  {r.installment_info && <span className="badge badge-subtle">parcela {r.installment_info}</span>}
                  {r.originalDescription !== r.description && (
                    <div className="text-secondary import-original">extrato: {r.originalDescription}</div>
                  )}
                </td>
                <td>
                  <input
                    className="input-glass input-compact"
                    type="number"
                    step="0.01"
                    value={r.amount}
                    onChange={(e) => patch(r.key, { amount: Math.abs(Number(e.target.value) || 0) })}
                  />
                </td>
                <td>
                  <select
                    className="input-glass input-compact"
                    value={r.type}
                    onChange={(e) => patch(r.key, { type: e.target.value })}
                  >
                    <option value="despesa">Saída</option>
                    <option value="receita">Entrada</option>
                  </select>
                </td>
                <td>
                  {r.type === 'despesa' ? (
                    <select
                      className="input-glass input-compact"
                      value={r.category_id}
                      onChange={(e) => patch(r.key, { category_id: e.target.value })}
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
        {missingName > 0 && (
          <span className="text-warning">
            <AlertTriangle size={15} /> {missingName} linha(s) sem descrição.
          </span>
        )}
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
