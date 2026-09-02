// Regenera src/data/initialData.js com os dados reais de agosto/2026 (extrato Bradesco + fatura Itaú)
// e a previsão de setembro/2026. Para um novo mês: ajuste as listas abaixo e rode de novo.
// Idempotente: tudo que este script gera tem id inc-aug-*, inc-sep-*, exp-aug-*, exp-sep-*, exp-card-*.
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Raiz do projeto (pasta acima de scripts/). Rodar: node scripts/gen_seed.mjs
const BASE = fileURLToPath(new URL('..', import.meta.url)).replace(/[\/]+$/, '');
const seed = await import(pathToFileURL(`${BASE}/src/data/initialData.js`).href);
const fin = await import(pathToFileURL(`${BASE}/src/utils/finance.js`).href);
const { addMonths, getInvoiceMonth } = fin;

const ITAU = 'card-credicard';
const ITAU_CLOSING = 20;
const BRADESCO = 'card-bradesco';
const owned = (id, prefixes) => prefixes.some(p => (id || '').startsWith(p));

// ---------------------------------------------------------------- contas
const RESERVE_IDS = ['acc-eqi', 'acc-cofrinho-itau'];
const accounts = seed.INITIAL_ACCOUNTS
  .filter(a => !RESERVE_IDS.includes(a.id))
  .map(a => ({ ...a, type: a.type || 'movimentacao' }));
accounts.push(
  { id: 'acc-eqi', name: 'Reserva EQI (Investimentos)', initial_balance: 10000, icon: 'PiggyBank', type: 'reserva' },
  { id: 'acc-cofrinho-itau', name: 'Cofrinho Itaú', initial_balance: 10000, icon: 'PiggyBank', type: 'reserva' }
);

// ---------------------------------------------------------------- cartões
const creditCards = seed.INITIAL_CREDIT_CARDS.map(c => {
  if (c.id === ITAU) {
    return { ...c, name: 'Credicard Zero (Itaú) •9040', limit_amount: 56840, closing_day: 20, due_day: 27, color: '#f97316' };
  }
  if (c.id === BRADESCO) {
    // Limite desconhecido (0 = não mostra % do limite). Fecha dia 20, vence dia 28.
    return { ...c, name: 'Cartão Bradesco', limit_amount: 0, closing_day: 20, due_day: 28, color: '#dc2626' };
  }
  return c;
});

// ---------------------------------------------------------------- categorias
const categories = [...seed.INITIAL_CATEGORIES];
if (!categories.find(c => c.id === 'cat-reservas')) {
  categories.push({ id: 'cat-reservas', name: 'Reservas & Investimentos', monthly_limit: 0, color: '#0ea5e9', icon: 'PiggyBank' });
}

// ---------------------------------------------------------------- receitas
const incomes = seed.INITIAL_INCOMES.filter(i => !owned(i.id, ['inc-aug-', 'inc-sep-']));
let incSeq = { aug: 0, sep: 0 };
const inc = (m, date, description, predicted, actual, account_id, notes = '') => ({
  id: `inc-${m}-${++incSeq[m]}`,
  date,
  description,
  predicted_amount: predicted,
  actual_amount: actual,
  account_id,
  status: actual > 0 ? 'ok' : 'pendente',
  notes
});

// Agosto — extrato Bradesco (créditos R$ 21.083,71)
incomes.push(
  inc('aug', '2026-08-03', 'UFF (Salário)', 11222.56, 11265.04, 'acc-jeff', 'TED CSAL p/ ccor (03/08)'),
  inc('aug', '2026-08-01', 'Ajuda JJ', 300, 300, 'acc-jeff', ''),
  inc('aug', '2026-08-07', 'Ajuda remédio Bel', 400, 400, 'acc-bel', 'PIX Paulo Fernando Maia (07/08)'),
  inc('aug', '2026-08-10', 'PIX Recebido Ludmila / Suelena / Eduardo', 375, 375, 'acc-jeff', '3 × R$ 125,00'),
  inc('aug', '2026-08-14', 'PIX Recebido Clarice', 90, 90, 'acc-jeff', ''),
  inc('aug', '2026-08-20', 'Verbo (Parcela 1)', 3000, 3000, 'acc-jeff', 'PIX Isabel Cristina 20/08'),
  inc('aug', '2026-08-27', 'Verbo (Parcela 2)', 3000, 3000, 'acc-jeff', 'PIX 27/08'),
  inc('aug', '2026-08-28', 'Verbo (complemento)', 2713.42, 2713.42, 'acc-jeff', 'PIX 28/08 — não estava na planilha')
);

// Setembro
incomes.push(
  inc('sep', '2026-09-01', 'UFF (Salário)', 11222.56, 11410.19, 'acc-jeff', 'Extrato Bradesco 01/09'),
  inc('sep', '2026-09-01', 'Ajuda JJ', 300, 0, 'acc-jeff', ''),
  inc('sep', '2026-09-07', 'Ajuda remédio Bel', 400, 0, 'acc-bel', 'PIX Paulo Fernando Maia'),
  inc('sep', '2026-09-15', 'Verbo (Parcela 1)', 3000, 0, 'acc-jeff', ''),
  inc('sep', '2026-09-28', 'Verbo (Parcela 2)', 3000, 0, 'acc-jeff', '')
);

// ---------------------------------------------------------------- despesas
// Mantém tudo que já existia (meses anteriores), exceto o que este script gera.
const expenses = seed.INITIAL_EXPENSES.filter(e => !owned(e.id, ['exp-aug-', 'exp-sep-', 'exp-card-']));

let expSeq = { aug: 0, sep: 0 };
const exp = (m, date, description, category_id, predicted, actual, extra = {}) => ({
  id: `exp-${m}-${++expSeq[m]}`,
  date,
  description,
  category_id,
  predicted_amount: predicted,
  actual_amount: actual,
  payment_method: 'PIX',
  account_id: 'acc-jeff',
  status: actual > 0 ? 'ok' : 'pendente',
  notes: '',
  ...extra
});
const aug = (date, description, category_id, predicted, actual, extra = {}) => exp('aug', date, description, category_id, predicted, actual, extra);
const sep = (date, description, category_id, predicted, extra = {}) => exp('sep', date, description, category_id, predicted, 0, extra);
const BEL = { account_id: 'acc-bel' };
const QR = { payment_method: 'Débito / Pix' };

// ---- Agosto: fixas (planejado na planilha × real no extrato Bradesco; débitos R$ 21.107,41)
expenses.push(
  aug('2026-08-05', 'DUDA Renovação CNH Bel', 'cat-transporte', 200, 200, { ...BEL, notes: 'Conta da Bel (não aparece no extrato Bradesco)' }),
  aug('2026-08-05', 'Rybelsus', 'cat-saude', 599, 599, { ...BEL, notes: 'Conta da Bel (não aparece no extrato Bradesco)' }),
  aug('2026-08-10', 'Colégio (Educandário Miosótis)', 'cat-educacao', 3000, 3002, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Condomínio', 'cat-moradia', 440, 440, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Ajuda Missão Kids', 'cat-doacoes', 400, 400, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Consórcio (Ademicon)', 'cat-emprestimos', 344.67, 344.63, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Aula Teclado (Rogério)', 'cat-educacao', 125, 125, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'IPTU Nova Friburgo', 'cat-moradia', 112.91, 112.91, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Internet (Giga Mais Fibra)', 'cat-servicos', 109.99, 114.55, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-10', 'Allianz Seguros', 'cat-outros', 79.62, 79.62, { notes: 'Extrato Bradesco 10/08. NÃO estava na planilha — conferir o que é (seguro de quê?)' }),
  aug('2026-08-10', 'Cobrança Itaú', 'cat-servicos', 37.50, 37.50, { notes: 'Extrato Bradesco 10/08. NÃO estava na planilha — conferir (tarifa? anuidade?)' }),
  aug('2026-08-10', 'Thiago (Empréstimo)', 'cat-emprestimos', 250, 0, { notes: 'Parcela 6/12 de R$ 250. Não aparece no extrato Bradesco de agosto — confirmar se foi pago' }),
  aug('2026-08-17', 'Financiamento Apartamento', 'cat-moradia', 3029.42, 3026.57, { notes: 'Extrato Bradesco 17/08' }),
  aug('2026-08-20', 'Cabelo Jeff', 'cat-saude', 45, 0, { ...BEL }),
  aug('2026-08-20', 'Cabelo Vicente', 'cat-saude', 45, 45, { ...BEL }),
  aug('2026-08-24', 'Luz (Energisa)', 'cat-moradia', 300, 428.24, { notes: 'Extrato Bradesco 24/08. Planejado na planilha: R$ 300' }),
  aug('2026-08-24', 'Vivo', 'cat-servicos', 131.90, 141.90, { notes: 'Extrato Bradesco 24/08' }),
  aug('2026-08-27', 'Fatura Credicard Zero (Itaú)', 'cat-cartoes', 4624.10, 4624.10, { card_id: ITAU, is_invoice_payment: true, notes: 'Fatura fechada em 20/08 (PDF), paga em 27/08. Planejado na planilha: R$ 1.700' }),
  aug('2026-08-28', 'Fatura Cartão Bradesco', 'cat-cartoes', 2250, 3113.77, { card_id: BRADESCO, is_invoice_payment: true, notes: 'Extrato Bradesco 28/08 ("Gasto c Crédito"). Planejado na planilha: R$ 2.250' }),
  aug('2026-08-30', 'Psicólogo', 'cat-saude', 320, 0, { notes: 'Não aparece no extrato Bradesco de agosto' })
);

// ---- Agosto: mercado / padaria / posto (Pix QR no extrato)
expenses.push(
  aug('2026-08-31', 'Pão com Letras Panificadora', 'cat-alimentacao', 637.50, 637.50, { ...QR, notes: '5 compras no mês (Pix QR)' }),
  aug('2026-08-31', 'Celta Padaria & Lanchonete', 'cat-alimentacao', 272.84, 272.84, { ...QR, notes: '4 compras no mês (Pix QR)' }),
  aug('2026-08-07', 'Cereais Bramil (Mercado)', 'cat-alimentacao', 328.67, 328.67, { ...QR, notes: 'Extrato Bradesco 07/08' }),
  aug('2026-08-23', 'Mercado Frotte', 'cat-alimentacao', 132.51, 132.51, { ...QR, notes: 'Extrato Bradesco 23/08' }),
  aug('2026-08-31', 'Horti Frutti', 'cat-alimentacao', 77.52, 77.52, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Hzine', 'cat-outros', 58.96, 58.96, { ...QR, notes: 'Extrato Bradesco ago/26 — conferir o que é' }),
  aug('2026-08-31', 'Praça Rotary', 'cat-lazer', 46.20, 46.20, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Americanas', 'cat-outros', 57.46, 57.46, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Ana Julia (Pix)', 'cat-outros', 19.90, 19.90, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Karina (Pix)', 'cat-outros', 33, 33, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Moniki (Pix)', 'cat-outros', 10, 10, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-31', 'Drogarias Pacheco', 'cat-saude', 4.99, 4.99, { ...QR, notes: 'Extrato Bradesco ago/26' }),
  aug('2026-08-07', 'Posto Mega Via Express (Gasolina)', 'cat-transporte', 200, 200, { ...QR, notes: '2 × R$ 100 (Pix QR)' })
);

// ---- Agosto: transferências e pessoas (extrato Bradesco)
expenses.push(
  aug('2026-08-03', 'M. Thurler (Pix)', 'cat-outros', 150, 150, { notes: 'Extrato Bradesco 03/08 — conferir o que é' }),
  aug('2026-08-07', 'Daniela Otávio Teixeira', 'cat-outros', 542, 542, { notes: 'Extrato Bradesco 07/08' }),
  aug('2026-08-08', 'Fernandes & Figueiredo', 'cat-outros', 518.97, 518.97, { ...QR, notes: 'Extrato Bradesco 08/08' }),
  aug('2026-08-08', 'Fabiana T Schimidt', 'cat-lazer', 135, 135, { notes: 'Extrato Bradesco 08/08' }),
  aug('2026-08-10', 'Bruno dos Santos Cruz', 'cat-outros', 160, 160, { notes: 'Extrato Bradesco 10/08' }),
  aug('2026-08-31', 'Bruno dos Santos Cruz', 'cat-outros', 160, 160, { notes: 'Extrato Bradesco 31/08' }),
  aug('2026-08-11', 'Transferência Jefferson → Jefferson', 'cat-outros', 321, 321, { notes: 'Extrato Bradesco 11/08. Transferência para conta própria — conferir destino (Itaú?)' }),
  aug('2026-08-13', 'Transferência Isabel Cristina', 'cat-outros', 1200, 1200, { notes: '12/08 (R$ 200) + 13/08 (R$ 1.000)' }),
  aug('2026-08-31', 'Gustavo Pinel (Rotary)', 'cat-doacoes', 50, 50, { notes: 'Extrato Bradesco ago/26' })
);

// ---- Setembro: fixas (mesmo padrão de agosto, com os valores reais mais recentes)
expenses.push(
  sep('2026-09-05', 'Rybelsus', 'cat-saude', 599, { ...BEL }),
  sep('2026-09-10', 'Colégio (Educandário Miosótis)', 'cat-educacao', 3000, { notes: 'Agosto: R$ 3.002' }),
  sep('2026-09-10', 'Condomínio', 'cat-moradia', 440),
  sep('2026-09-10', 'Ajuda Missão Kids', 'cat-doacoes', 400),
  sep('2026-09-10', 'Consórcio (Ademicon)', 'cat-emprestimos', 344.63, { notes: 'Valor pago em agosto' }),
  sep('2026-09-10', 'Aula Teclado (Rogério)', 'cat-educacao', 125),
  sep('2026-09-10', 'IPTU Nova Friburgo', 'cat-moradia', 112.91),
  sep('2026-09-10', 'Internet (Giga Mais Fibra)', 'cat-servicos', 114.55, { notes: 'Valor pago em agosto' }),
  sep('2026-09-10', 'Allianz Seguros', 'cat-outros', 79.62, { notes: 'Apareceu no extrato de agosto (10/08). Conferir se é mensal e o que é' }),
  sep('2026-09-10', 'Cobrança Itaú', 'cat-servicos', 37.50, { notes: 'Apareceu no extrato de agosto (10/08). Conferir se é mensal e o que é' }),
  sep('2026-09-10', 'Thiago (Empréstimo)', 'cat-emprestimos', 250, { notes: 'Parcela 7/12 de R$ 250 (início 03/2026)' }),
  sep('2026-09-17', 'Financiamento Apartamento', 'cat-moradia', 3026.57, { notes: 'Valor de agosto; cai um pouco a cada mês' }),
  sep('2026-09-20', 'Suelena (Empréstimo)', 'cat-emprestimos', 1000, { notes: 'Dívida com Suelena: total R$ 14.000. Pago R$ 1.000 em 26/07. Após esta parcela restam R$ 12.000.' }),
  sep('2026-09-20', 'Cabelo Jeff', 'cat-saude', 45, { ...BEL }),
  sep('2026-09-20', 'Cabelo Vicente', 'cat-saude', 45, { ...BEL }),
  sep('2026-09-24', 'Luz (Energisa)', 'cat-moradia', 430, { notes: 'Agosto: R$ 428,24 (planilha previa R$ 300)' }),
  sep('2026-09-24', 'Vivo', 'cat-servicos', 141.90, { notes: 'Valor pago em agosto' }),
  sep('2026-09-27', 'Fatura Credicard Zero (Itaú)', 'cat-cartoes', 3530.00, { card_id: ITAU, is_invoice_payment: true, notes: 'Parcial do app Itaú em 02/09. A fatura fecha em 20/09; atualizar pela aba Cartões.' }),
  sep('2026-09-28', 'Fatura Cartão Bradesco', 'cat-cartoes', 1400, { card_id: BRADESCO, is_invoice_payment: true, notes: 'Previsão (fatura ainda aberta). Fecha 20/09, vence 28/09. Agosto: R$ 3.113,77' }),
  sep('2026-09-30', 'Psicólogo', 'cat-saude', 320),
  // Envelopes de gasto variável (linhas "-" da planilha)
  sep('2026-09-30', 'Alimentação / Mercado / Lanches (previsão)', 'cat-alimentacao', 2500, { ...QR, notes: 'Envelope do mês. Lance as compras reais e reduza esta linha. Agosto real (Pix QR): ~R$ 1.450' }),
  sep('2026-09-30', 'Lazer e Lanches (previsão)', 'cat-lazer', 400, { ...QR, notes: 'Envelope do mês. Lance as compras reais e reduza esta linha.' }),
  sep('2026-09-30', 'Gasolina (previsão)', 'cat-transporte', 600, { ...QR, notes: 'Envelope do mês. Lance os abastecimentos reais e reduza esta linha.' }),
  sep('2026-09-30', 'Outros (previsão)', 'cat-outros', 500, { ...QR, notes: 'Envelope do mês.' })
);

// ---------------------------------------------------------------- compras no cartão Itaú
let cardSeq = 0;
const cardItem = (date, description, category_id, value, { status = 'ok', installment_info = null, notes = '', final = '9040' } = {}) => ({
  id: `exp-card-itau-${++cardSeq}`,
  date,
  description,
  category_id,
  predicted_amount: value,
  actual_amount: status === 'ok' ? value : 0,
  payment_method: 'Cartão de Crédito',
  card_id: ITAU,
  ...(installment_info ? { installment_info } : {}),
  account_id: 'acc-jeff',
  status,
  notes: notes || `Cartão final ${final}`
});

const fmtBR = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

// Séries parceladas (data da 1ª parcela, nº de parcelas, valor da parcela). Gera as parcelas de ago/26 em diante.
const series = [
  ['MERCADOLIVRE*MERCA', '2025-08-28', 12, 524.99, 'cat-outros', '3011'],
  ['CARLOS PRESENTES', '2025-11-22', 10, 58.21, 'cat-outros', '9040'],
  ['ChilliBeans', '2025-12-26', 10, 170.62, 'cat-saude', '9040'],
  ['MITTE', '2026-03-26', 10, 40.00, 'cat-outros', '9040'],
  ['SUSPIRO INTIMO LIN', '2026-05-09', 6, 153.74, 'cat-outros', '9040'],
  ['RAIA 3468', '2026-05-24', 3, 36.02, 'cat-saude', '9040'],
  ['RAIA 3468', '2026-05-25', 3, 107.59, 'cat-saude', '9040'],
  ['SIAO MUSICAL LTDA', '2026-05-30', 5, 87.60, 'cat-lazer', '9040'],
  ['AMERICANAS SA', '2026-05-30', 3, 67.32, 'cat-outros', '9040'],
  ['ESTACAO SAUDE', '2026-06-22', 3, 39.99, 'cat-saude', '9040'],
  ['NATSPEL', '2026-06-27', 2, 69.17, 'cat-educacao', '9040'],
  ['ZP*LEO MAQUINAS', '2026-07-07', 3, 200.00, 'cat-moradia', '9040'],
  ['RAIA 3468', '2026-07-26', 3, 156.50, 'cat-saude', '9040'],
  ['MP *GUGASHOPPING', '2026-07-30', 2, 350.00, 'cat-outros', '9040'],
  ['LORENA AUTO PECAS', '2026-07-30', 5, 159.40, 'cat-transporte', '9040'],
  ['LLTREINOTRIN', '2026-08-08', 3, 13.33, 'cat-educacao', '3011'],
  ['ACQUANEWS COMERCIO', '2026-08-08', 2, 74.21, 'cat-outros', '9040'],
  ['RAIA 3468', '2026-08-13', 3, 58.66, 'cat-saude', '9040'],
  ['ESTACAO SAUDE', '2026-08-14', 3, 177.66, 'cat-saude', '9040'],
  ['ESTACAO SAUDE', '2026-08-18', 3, 198.11, 'cat-saude', '9040'],
];

for (const [desc, first, n, value, cat, final] of series) {
  for (let k = 1; k <= n; k++) {
    const date = addMonths(first, k - 1);
    const invMonth = getInvoiceMonth(date, ITAU_CLOSING);
    if (invMonth < '2026-08') continue;
    const confirmed = invMonth <= '2026-09'; // já lançado na fatura de ago ou na parcial de set
    expenses.push(cardItem(date, `${desc} (${k}/${n})`, cat, value, {
      status: confirmed ? 'ok' : 'pendente',
      installment_info: `${k}/${n}`,
      notes: `Compra em ${fmtBR(first)} • parcela ${k} de ${n} • cartão final ${final}`
    }));
  }
}

// Compras à vista da fatura de agosto (fechada em 20/08, venc. 27/08) — PDF
const augOneOff = [
  ['2026-07-24', 'EBN*SPOTIFY', 'cat-servicos', 23.90, '3011'],
  ['2026-07-26', 'PAC BERKHATHA FITNESS', 'cat-saude', 159.90, '3011'],
  ['2026-07-29', 'PAC BERKHATHA FITNESS', 'cat-saude', 159.90, '3011'],
  ['2026-08-07', 'DL*99 RIDE', 'cat-transporte', 14.96, '3011'],
  ['2026-08-18', 'ASA*Marcello Vieira Da', 'cat-outros', 96.00, '3011'],
  ['2026-08-18', 'ASA*Marcello Vieira Da', 'cat-outros', 96.00, '3011'],
  ['2026-07-21', 'CINESHOW', 'cat-lazer', 58.80, '9040'],
  ['2026-07-21', 'CINESHOW', 'cat-lazer', 51.00, '9040'],
  ['2026-07-21', 'CINESHOW', 'cat-lazer', 29.00, '9040'],
  ['2026-07-21', 'RAIA 3468', 'cat-saude', 44.84, '9040'],
  ['2026-07-21', '99APP *99App', 'cat-transporte', 40.30, '9040'],
  ['2026-07-23', 'MERCADO*GREYCOMLTDA (Campinas)', 'cat-lazer', 162.96, '9040'],
  ['2026-07-23', 'CARLOS PRESENTES', 'cat-outros', 76.35, '9040'],
  ['2026-07-29', 'SUPER PAO', 'cat-alimentacao', 23.98, '9040'],
  ['2026-07-31', 'Celta Padaria', 'cat-alimentacao', 59.72, '9040'],
  ['2026-08-01', 'FORNO DI LUMIAR', 'cat-alimentacao', 67.00, '9040'],
  ['2026-08-01', 'NEW BEGINNINGS (Niterói)', 'cat-outros', 59.90, '9040'],
  ['2026-08-02', 'FORNO DI LUMIAR', 'cat-alimentacao', 20.00, '9040'],
  ['2026-08-02', 'FORNO DI LUMIAR', 'cat-alimentacao', 60.00, '9040'],
  ['2026-08-02', 'CEREAIS BRAMIL PV10', 'cat-alimentacao', 234.21, '9040'],
  ['2026-08-06', 'NETFLIX', 'cat-servicos', 44.90, '9040'],
  ['2026-08-08', 'ROTA 116', 'cat-transporte', 9.60, '9040'],
  ['2026-08-13', 'ARP IMOBILIARIA', 'cat-moradia', 21.00, '9040'],
  ['2026-08-16', 'RD BOUTIQUE DE CARNES', 'cat-alimentacao', 15.50, '9040'],
  ['2026-08-17', 'DROGARIA ISAFARMA', 'cat-saude', 69.90, '9040'],
  ['2026-08-18', 'OBAH SNACK', 'cat-alimentacao', 3.50, '9040'],
  ['2026-08-18', 'OBAH SNACK', 'cat-alimentacao', 3.50, '9040'],
  ['2026-08-18', 'SUPER PAO', 'cat-alimentacao', 174.36, '9040'],
];
for (const [date, desc, cat, value, final] of augOneOff) {
  expenses.push(cardItem(date, desc, cat, value, { notes: `Fatura ago/26 • cartão final ${final}` }));
}

// Compras já lançadas na fatura de setembro (print do app Itaú em 02/09)
const sepOneOff = [
  ['2026-08-29', 'Calebito Nova Friburgo', 'cat-outros', 103.00],
  ['2026-08-29', 'PAC BERKHATHA FITNESS', 'cat-saude', 159.90],
  ['2026-08-29', 'Caçula Nova Friburgo', 'cat-outros', 30.95],
  ['2026-08-30', 'Armazém Frotte', 'cat-alimentacao', 135.77],
  ['2026-08-30', 'Drogarias Pacheco', 'cat-saude', 54.74],
];
for (const [date, desc, cat, value] of sepOneOff) {
  expenses.push(cardItem(date, desc, cat, value, { notes: 'Fatura set/26 • app Itaú 02/09' }));
}

// Previsões para a fatura de setembro (assinaturas recorrentes) + diferença ainda não detalhada
expenses.push(
  cardItem('2026-08-24', 'EBN*SPOTIFY (previsão)', 'cat-servicos', 23.90, { status: 'pendente', notes: 'Assinatura mensal (agosto: 24/07)' }),
  cardItem('2026-09-06', 'NETFLIX (previsão)', 'cat-servicos', 44.90, { status: 'pendente', notes: 'Assinatura mensal (agosto: 06/08)' })
);
const SEP_APP_PARTIAL = 3530.00;
const sepKnown = expenses
  .filter(e => e.card_id === ITAU && !e.is_invoice_payment && getInvoiceMonth(e.date, ITAU_CLOSING) === '2026-09')
  .reduce((s, e) => s + e.predicted_amount, 0);
const sepGap = Math.round((SEP_APP_PARTIAL - sepKnown) * 100) / 100;
if (sepGap > 0) {
  expenses.push(cardItem('2026-09-02', 'Outras compras 21/08 a 02/09 (conferir no app Itaú)', 'cat-outros', sepGap, {
    status: 'pendente',
    notes: `Diferença entre o parcial do app (R$ ${SEP_APP_PARTIAL.toFixed(2)}) e os itens conhecidos. Substituir pelos lançamentos reais.`
  }));
}

// ---------------------------------------------------------------- escrita
const out = [
  '// Dados iniciais (seed). Fonte: planilha FINANCEIRO 2026.xlsx, extrato Bradesco ago/26, fatura Itaú ago/26 (PDF)',
  '// e parcial da fatura set/26 (app Itaú, 02/09/2026). Gerado por scripts/gen_seed.mjs — não editar à mão.',
  '',
  `export const INITIAL_ACCOUNTS = ${JSON.stringify(accounts, null, 2)};`,
  '',
  `export const INITIAL_CREDIT_CARDS = ${JSON.stringify(creditCards, null, 2)};`,
  '',
  `export const INITIAL_CATEGORIES = ${JSON.stringify(categories, null, 2)};`,
  '',
  `export const INITIAL_INCOMES = ${JSON.stringify(incomes, null, 2)};`,
  '',
  `export const INITIAL_EXPENSES = ${JSON.stringify(expenses, null, 2)};`,
  ''
].join('\n');
fs.writeFileSync(`${BASE}/src/data/initialData.js`, out, 'utf8');

// ---------------------------------------------------------------- verificação
const r2 = (v) => Math.round(v * 100) / 100;
const sum = (arr, f) => r2(arr.reduce((s, x) => s + (f(x) || 0), 0));
const byInvoice = {};
for (const e of expenses.filter(e => e.card_id === ITAU && !e.is_invoice_payment)) {
  const m = getInvoiceMonth(e.date, ITAU_CLOSING);
  byInvoice[m] = byInvoice[m] || { n: 0, total: 0 };
  byInvoice[m].n++;
  byInvoice[m].total = r2(byInvoice[m].total + e.predicted_amount);
}
console.log('Fatura Itaú por mês (esperado: ago 4624.10 | set 3530.00 | out 1215.62 | nov 199.40 | dez 199.40 | jan 40.00):');
for (const m of Object.keys(byInvoice).sort()) console.log(`  ${m}: ${byInvoice[m].n} itens = R$ ${byInvoice[m].total.toFixed(2)}`);

const isCash = (e) => !(e.card_id && !e.is_invoice_payment);
const augCash = expenses.filter(e => e.date.startsWith('2026-08') && isCash(e));
const augJeff = augCash.filter(e => e.account_id === 'acc-jeff');
console.log(`Agosto caixa (conta Jeff, extrato Bradesco): ${augJeff.length} linhas | real R$ ${sum(augJeff, e => e.actual_amount).toFixed(2)} (extrato: débitos 21.107,41)`);
const augInc = incomes.filter(i => i.date.startsWith('2026-08') && i.account_id === 'acc-jeff');
console.log(`Agosto receitas (conta Jeff): ${augInc.length} linhas | real R$ ${sum(augInc, i => i.actual_amount).toFixed(2)} (extrato: créditos 21.083,71)`);
const sepCash = expenses.filter(e => e.date.startsWith('2026-09') && isCash(e));
console.log(`Setembro caixa: ${sepCash.length} linhas | previsto R$ ${sum(sepCash, e => e.predicted_amount).toFixed(2)}`);
const sepInc = incomes.filter(i => i.date.startsWith('2026-09'));
console.log(`Setembro receitas: ${sepInc.length} linhas | previsto R$ ${sum(sepInc, i => i.predicted_amount).toFixed(2)} | já recebido R$ ${sum(sepInc, i => i.actual_amount).toFixed(2)}`);
console.log(`Totais: ${accounts.length} contas, ${creditCards.length} cartões, ${categories.length} categorias, ${incomes.length} receitas, ${expenses.length} despesas`);
