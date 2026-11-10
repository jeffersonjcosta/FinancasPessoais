// Parsers de extrato bancario e de fatura de cartao. Sem React: da pra testar em Node.
// Usado por components/ImportStatement.jsx.
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------- helpers de texto
export const toNumber = (raw) => {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;
  const clean = String(raw).replace(/[R$\s ]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
};

export const pad = (n) => String(n).padStart(2, '0');

// dd/mm/aaaa, dd/mm/aa, dd/mm (ano inferido do mês selecionado) ou Date do SheetJS
export const toISODate = (raw, fallbackMonth) => {
  if (raw instanceof Date && !isNaN(raw)) {
    return `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
  }
  const txt = String(raw || '').trim();
  let m = txt.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    return `${year}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  }
  m = txt.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = txt.match(/^(\d{1,2})[\/.-](\d{1,2})$/);
  if (m) {
    const [baseYear, baseMonth] = (fallbackMonth || '2026-01').split('-').map(Number);
    const month = Number(m[2]);
    // Compra de dezembro numa fatura de janeiro: cai no ano anterior.
    const year = month - baseMonth > 6 ? baseYear - 1 : baseYear;
    return `${year}-${pad(month)}-${pad(Number(m[1]))}`;
  }
  return '';
};

export const cleanDescription = (desc) => String(desc || '')
  .replace(/\s+/g, ' ')
  .replace(/^(PIX|TED|DOC)\s+(RECEBIDO|ENVIADO|TRANSF)\s*/i, (s) => s.trim() + ' ')
  .trim();

// Sugestão de categoria por palavra-chave. O usuário confirma tudo na revisão.
export const CATEGORY_HINTS = [
  ['cat-alimentacao', /padaria|panific|mercado|superm|bramil|hortifruti|horti|acougue|açougue|carnes|pao|pão|lanche|restaurante|pizza|frotte|celta|obah|forno/i],
  ['cat-saude', /farmac|farmác|drogaria|raia|pacheco|isafarma|clinica|clínica|laborat|psicolog|psicólog|dentist|academia|fitness|estacao saude|estação saúde|rybelsus|cabelo/i],
  ['cat-transporte', /posto|combust|gasolina|shell|ipiranga|petrobras|uber|99|taxi|táxi|estacion|pedagio|pedágio|auto pecas|peças|mecanic|mecânic|detran|duda/i],
  ['cat-moradia', /condomin|condomín|aluguel|financiamento|iptu|energisa|luz|enel|cedae|agua|água|gas|gás|imobiliaria|imobiliária/i],
  ['cat-servicos', /vivo|claro|tim|oi |internet|giga|netflix|spotify|prime|disney|hbo|max|assinatura|telefon|tarifa|anuidade|cobranca|cobrança/i],
  ['cat-educacao', /colegio|colégio|escola|educand|curso|faculdade|livro|papelaria|teclado|aula|miosotis|miosótis/i],
  ['cat-lazer', /cinema|cineshow|bar |cerveja|ingresso|show|viagem|hotel|airbnb|parque|rotary/i],
  ['cat-doacoes', /igreja|dizimo|dízimo|oferta|missao|missão|doacao|doação|kids/i],
  ['cat-emprestimos', /emprest|emprést|consorcio|consórcio|ademicon|parcela|financ pessoal|suelena|thiago/i],
  ['cat-cartoes', /fatura|cartao de credito|cartão de crédito|gasto c credito|gasto c crédito|pagamento cartao|pagamento cartão/i],
];

export const guessCategory = (description, categories) => {
  const ids = new Set(categories.map(c => c.id));
  for (const [id, re] of CATEGORY_HINTS) {
    if (ids.has(id) && re.test(description)) return id;
  }
  return categories.find(c => c.id === 'cat-outros')?.id || categories[0]?.id || '';
};

// Linhas que não são lançamento de verdade
export const IGNORE_LINE = /saldo\s+(anterior|atual|do dia|final|em conta)|total\s+(de|geral|da fatura|desta fatura)|^saldo$|limite|lancamentos futuros|lançamentos futuros|pagamento efetuado em|resumo|subtotal|^data\b.*hist|^periodo|^período/i;

// ---------------------------------------------------------------- parsers
// Bradesco costuma exportar "xls" que é HTML. DOMParser lê melhor (e resolve acentuação).
export const looksLikeHtml = (bytes) => {
  const head = new TextDecoder('iso-8859-1').decode(bytes.slice(0, 1024)).toLowerCase();
  return head.includes('<html') || head.includes('<table') || head.trimStart().startsWith('<');
};

export const decodeText = (bytes) => {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  // Caractere de substituição indica que não era utf-8: relê como Latin-1.
  return utf8.includes('�') ? new TextDecoder('iso-8859-1').decode(bytes) : utf8;
};

export const gridFromHtml = (bytes) => {
  const doc = new DOMParser().parseFromString(decodeText(bytes), 'text/html');
  const grid = [];
  doc.querySelectorAll('tr').forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td,th'))
      .map(td => td.textContent.replace(/ /g, ' ').trim());
    if (cells.some(c => c)) grid.push(cells);
  });
  return grid;
};

export const gridFromSheet = (bytes) => {
  const wb = XLSX.read(bytes, { type: 'array', cellDates: true, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false, raw: false });
};

// Descobre, pelo cabeçalho, quais colunas são data / histórico / crédito / débito / valor.
export const findColumns = (grid) => {
  for (let i = 0; i < Math.min(grid.length, 25); i++) {
    const row = grid[i].map(c => String(c).toLowerCase());
    const joined = row.join(' | ');
    if (!/data/.test(joined)) continue;
    const find = (re) => row.findIndex(c => re.test(c));
    const cols = {
      headerRow: i,
      date: find(/data/),
      desc: find(/hist[oó]rico|lan[cç]amento|descri[cç][aã]o|estabelecimento/),
      credit: find(/cr[eé]dito/),
      debit: find(/d[eé]bito/),
      value: find(/^valor|valor\s*\(r\$\)|valor r\$/),
      doc: find(/docto|documento/),
    };
    if (cols.date >= 0 && cols.desc >= 0 && (cols.credit >= 0 || cols.debit >= 0 || cols.value >= 0)) return cols;
  }
  return null;
};

export const parseGrid = (grid, fallbackMonth) => {
  const cols = findColumns(grid);
  const rows = [];
  const start = cols ? cols.headerRow + 1 : 0;

  for (let i = start; i < grid.length; i++) {
    const cells = grid[i].map(c => (c == null ? '' : String(c).replace(/ /g, ' ').trim()));
    const joined = cells.join(' ');
    if (!joined.trim() || IGNORE_LINE.test(joined)) continue;

    let date = '';
    let description = '';
    let amount = 0;
    let isCredit = false;

    if (cols) {
      date = toISODate(cells[cols.date], fallbackMonth);
      description = cleanDescription(cells[cols.desc]);
      const credit = cols.credit >= 0 ? toNumber(cells[cols.credit]) : 0;
      const debit = cols.debit >= 0 ? toNumber(cells[cols.debit]) : 0;
      const value = cols.value >= 0 ? toNumber(cells[cols.value]) : 0;
      if (credit > 0) { amount = credit; isCredit = true; }
      else if (debit !== 0) { amount = Math.abs(debit); isCredit = false; }
      else if (value !== 0) { amount = Math.abs(value); isCredit = value > 0; }
    } else {
      // Sem cabeçalho reconhecido: primeira célula com data, última com valor.
      const dateCell = cells.find(c => toISODate(c, fallbackMonth));
      date = toISODate(dateCell, fallbackMonth);
      const valueCells = cells.filter(c => /-?[\d.]+,\d{2}$/.test(c));
      const last = valueCells[valueCells.length - 1];
      amount = Math.abs(toNumber(last));
      isCredit = !/^-/.test(String(last || ''));
      description = cleanDescription(cells.filter(c => c !== dateCell && c !== last).join(' '));
    }

    if (!date || !amount) continue;
    rows.push({ date, description: description || 'Lançamento importado', amount, isCredit });
  }
  return rows;
};

// Fatura de cartão em PDF: uma linha por compra, "dd/mm DESCRIÇÃO 123,45".
export const LINE_RE = /^(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\s+(.{3,}?)\s+(-?[\d.]*\d,\d{2})$/;
export const CARD_HEADER_RE = /(?:final|n[ºo°]?\.?)\s*[\s:]*(\d{4})/i;

export const parsePdfText = (text, fallbackMonth) => {
  const rows = [];
  let currentCard = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    if (!line) continue;

    const cardHeader = line.match(CARD_HEADER_RE);
    if (cardHeader && /final|cart[aã]o|titular|adicional/i.test(line) && !LINE_RE.test(line)) {
      currentCard = cardHeader[1];
      continue;
    }
    if (IGNORE_LINE.test(line)) continue;

    const m = line.match(LINE_RE);
    if (!m) continue;

    const date = toISODate(m[1], fallbackMonth);
    if (!date) continue;
    let description = cleanDescription(m[2]);
    const amount = toNumber(m[3]);
    if (!amount) continue;

    // Parcelamento vem colado na descrição ("03/10" ou "PARCELA 3 DE 10").
    let installment = null;
    const inst = description.match(/(\d{1,2})\s*(?:\/|\s+de\s+)\s*(\d{1,2})\s*$/i);
    if (inst && Number(inst[2]) > 1 && Number(inst[1]) <= Number(inst[2])) {
      installment = `${Number(inst[1])}/${Number(inst[2])}`;
      description = description.slice(0, inst.index).trim();
    }

    rows.push({
      date,
      description: description || 'Compra importada',
      amount: Math.abs(amount),
      isCredit: amount < 0, // estorno na fatura
      cardFinal: currentCard,
      installment,
    });
  }
  return rows;
};

export const parseOfx = (text, fallbackMonth) => {
  const rows = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  for (const block of blocks) {
    const get = (tag) => (block.match(new RegExp(`<${tag}>([^<\r\n]*)`, 'i')) || [])[1]?.trim() || '';
    const raw = get('DTPOSTED');
    const date = raw.length >= 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : toISODate(raw, fallbackMonth);
    const value = toNumber(get('TRNAMT').replace('.', ','));
    const description = cleanDescription(get('MEMO') || get('NAME'));
    if (!date || !value) continue;
    rows.push({ date, description: description || 'Lançamento importado', amount: Math.abs(value), isCredit: value > 0 });
  }
  return rows;
};
