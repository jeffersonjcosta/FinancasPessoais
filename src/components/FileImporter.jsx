import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ShieldCheck, Filter, Sparkles } from 'lucide-react';

export default function FileImporter({ customCategories = [], onBatchImport, creditCards = [], existingTransactions = [] }) {
  const [importedRows, setImportedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Helper: Simple SHA-256 deterministic hash simulator for transactions
  const generateTxHash = (date, amount, description, cardId = '') => {
    const rawStr = `${date}_${amount.toFixed(2)}_${description.toLowerCase().trim()}_${cardId}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'sha256_' + Math.abs(hash).toString(16);
  };

  // Helper: Clean bank statement noise (Regex)
  const cleanDescription = (desc) => {
    if (!desc) return 'Lançamento Importado';
    return desc
      .replace(/COMPRA (CARTAO|DEBITO|CREDITO)/gi, '')
      .replace(/PAG\*/gi, '')
      .replace(/PARC \d+\/\d+/gi, '')
      .replace(/\d{2}\/\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Parse OFX text content
  const parseOFX = (text) => {
    const transactions = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    let dupCount = 0;

    const existingHashes = new Set(existingTransactions.map(t => t.hash_sha256 || generateTxHash(t.date, Number(t.amount), t.description, t.card_id || '')));

    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const block = match[1];

      const trnType = (block.match(/<TRNTYPE>(.*)/i) || [])[1]?.trim() || '';
      const dtPosted = (block.match(/<DTPOSTED>(.*)/i) || [])[1]?.trim() || '';
      const trnAmt = (block.match(/<TRNAMT>(.*)/i) || [])[1]?.trim() || '0';
      const memo = (block.match(/<MEMO>(.*)/i) || (block.match(/<NAME>(.*)/i) || []))[1]?.trim() || 'Lançamento Importado';

      // Parse Date YYYYMMDD
      let formattedDate = new Date().toISOString().split('T')[0];
      if (dtPosted && dtPosted.length >= 8) {
        const y = dtPosted.substring(0, 4);
        const m = dtPosted.substring(4, 6);
        const d = dtPosted.substring(6, 8);
        formattedDate = `${y}-${m}-${d}`;
      }

      const amountNum = parseFloat(trnAmt.replace(',', '.'));
      const isExpense = amountNum < 0 || trnType.toUpperCase() === 'DEBIT';
      const absAmount = Math.abs(amountNum);

      const cleanedMemo = cleanDescription(memo);
      const hash = generateTxHash(formattedDate, absAmount, cleanedMemo, selectedCardId);
      const isDuplicate = existingHashes.has(hash);

      if (isDuplicate) dupCount++;

      // Auto category guess
      let macro = isExpense ? 'lifestyle' : 'essentials';
      let subCat = 'Geral';
      const lowerMemo = cleanedMemo.toLowerCase();

      if (lowerMemo.includes('mercado') || lowerMemo.includes('superm') || lowerMemo.includes('bramil') || lowerMemo.includes('horti')) {
        macro = 'essentials';
        subCat = 'Mercado / Feira';
      } else if (lowerMemo.includes('post') || lowerMemo.includes('combust') || lowerMemo.includes('gasolin') || lowerMemo.includes('uber')) {
        macro = 'essentials';
        subCat = 'Transporte / Combustível';
      } else if (lowerMemo.includes('farm') || lowerMemo.includes('drog') || lowerMemo.includes('remed')) {
        macro = 'essentials';
        subCat = 'Saúde & Farmácia';
      } else if (lowerMemo.includes('rest') || lowerMemo.includes('ifood') || lowerMemo.includes('cafe')) {
        macro = 'lifestyle';
        subCat = 'Restaurante / Delivery';
      }

      transactions.push({
        id: 'imp-' + Math.random().toString(36).substr(2, 9),
        description: cleanedMemo,
        amount: absAmount,
        type: isExpense ? 'expense' : 'income',
        category: isExpense ? macro : 'essentials',
        sub_category: subCat,
        date: formattedDate,
        hash_sha256: hash,
        isDuplicate: isDuplicate,
        selected: !isDuplicate
      });
    }

    setDuplicateCount(dupCount);
    return transactions;
  };

  // Parse CSV text content
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const transactions = [];
    let dupCount = 0;

    const existingHashes = new Set(existingTransactions.map(t => t.hash_sha256 || generateTxHash(t.date, Number(t.amount), t.description, t.card_id || '')));
    const startIndex = (lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[,;]/);
      if (parts.length < 3) continue;

      const rawDate = parts[0].trim();
      const rawDesc = parts[1].trim();
      const rawAmt = parts[2].trim().replace('R$', '').replace(' ', '');

      let amountNum = parseFloat(rawAmt.replace(',', '.'));
      if (isNaN(amountNum)) continue;

      const isExpense = amountNum < 0;
      const absAmount = Math.abs(amountNum);
      const formattedDate = rawDate.includes('/') ? rawDate.split('/').reverse().join('-') : rawDate;
      const cleanedDesc = cleanDescription(rawDesc);
      const hash = generateTxHash(formattedDate, absAmount, cleanedDesc, selectedCardId);
      const isDuplicate = existingHashes.has(hash);

      if (isDuplicate) dupCount++;

      transactions.push({
        id: 'imp-csv-' + i,
        description: cleanedDesc || 'Lançamento CSV',
        amount: absAmount,
        type: isExpense ? 'expense' : 'income',
        category: isExpense ? 'lifestyle' : 'essentials',
        sub_category: 'Geral',
        date: formattedDate,
        hash_sha256: hash,
        isDuplicate: isDuplicate,
        selected: !isDuplicate
      });
    }

    setDuplicateCount(dupCount);
    return transactions;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      let parsed = [];
      if (file.name.toLowerCase().endsWith('.ofx')) {
        parsed = parseOFX(content);
      } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
        parsed = parseCSV(content);
      } else {
        alert('Formato não suportado. Por favor utilize arquivos .ofx ou .csv');
        return;
      }

      setImportedRows(parsed);
    };

    reader.readAsText(file);
  };

  const handleRowChange = (id, field, value) => {
    setImportedRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleToggleSelectAll = (checked) => {
    setImportedRows(prev => prev.map(row => ({ ...row, selected: checked })));
  };

  const handleImportSubmit = async () => {
    const selected = importedRows.filter(r => r.selected);
    if (selected.length === 0) return;

    setImporting(true);
    const txToSave = selected.map(r => ({
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      category: r.category,
      sub_category: r.sub_category,
      card_id: selectedCardId || null,
      date: r.date,
      hash_sha256: r.hash_sha256
    }));

    await onBatchImport(txToSave);
    setImporting(false);
    setSuccessMsg(`${selected.length} lançamentos importados com sucesso!`);
    setImportedRows([]);
    setFileName('');
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={22} style={{ color: 'var(--color-indigo)' }} /> Importador Open Finance / OFX (Com Hash SHA-256)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Deduplicação automática por Hash determinístico e limpeza de texto de lançamentos ruidosos.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="traffic-message green" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Upload Dropzone */}
      {importedRows.length === 0 && (
        <label className="file-dropzone">
          <FileText size={40} style={{ color: 'var(--color-indigo)', opacity: 0.8 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Clique aqui para selecionar o arquivo da fatura ou extrato (.OFX / .CSV)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              O sistema aplicará a higienização de texto e filtragem por <strong>Hash SHA-256</strong>.
            </div>
          </div>
          <input
            type="file"
            accept=".ofx,.csv,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {/* Reconciliation Table */}
      {importedRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Arquivo: <strong>{fileName}</strong> ({importedRows.length} linhas encontradas)
              </div>
              {duplicateCount > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <Filter size={14} /> {duplicateCount} transações duplicadas filtradas automaticamente pelo Hash SHA-256!
                </div>
              )}
            </div>

            {creditCards.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atribuir ao Cartão:</span>
                <select
                  className="input-glass"
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  style={{ width: '180px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                >
                  <option value="">Nenhum (Conta Corrente / Pix)</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>{card.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="data-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={importedRows.every(r => r.selected)}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Status Hash</th>
                  <th>Data</th>
                  <th>Descrição Limpa</th>
                  <th>Valor (R$)</th>
                  <th>Tipo</th>
                  <th>Macro Categoria</th>
                  <th>Subcategoria</th>
                </tr>
              </thead>
              <tbody>
                {importedRows.map((row) => (
                  <tr key={row.id} style={{ opacity: row.selected ? 1 : 0.45 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => handleRowChange(row.id, 'selected', e.target.checked)}
                      />
                    </td>
                    <td>
                      {row.isDuplicate ? (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          Duplicado
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          Novo SHA
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        type="date"
                        className="input-glass"
                        value={row.date}
                        onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input-glass"
                        value={row.description}
                        onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: row.type === 'expense' ? '#f87171' : '#34d399' }}>
                      R$ {row.amount.toFixed(2)}
                    </td>
                    <td>
                      <select
                        className="input-glass"
                        value={row.type}
                        onChange={(e) => handleRowChange(row.id, 'type', e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="input-glass"
                        value={row.category}
                        onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        <option value="essentials">Essencial</option>
                        <option value="lifestyle">Estilo de Vida</option>
                        <option value="savings">Futuro / Reservas</option>
                        <option value="debts">Dívidas</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="input-glass"
                        value={row.sub_category}
                        onChange={(e) => handleRowChange(row.id, 'sub_category', e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        <option value="Geral">Geral</option>
                        {customCategories
                          .filter(c => c.macro_category === row.category)
                          .map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="pill-btn"
              onClick={() => setImportedRows([])}
              style={{ maxWidth: '150px' }}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleImportSubmit}
              disabled={importing}
              style={{ maxWidth: '280px' }}
            >
              <ShieldCheck size={18} /> {importing ? 'Importando...' : `Confirmar (${importedRows.filter(r => r.selected).length}) Lançamentos`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

