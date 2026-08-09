// Default initial data seeded from FINANCEIRO 2026.xlsx

export const INITIAL_ACCOUNTS = [
  {
    "id": "acc-carteira",
    "name": "Carteira / Dinheiro",
    "initial_balance": 0,
    "icon": "Wallet"
  },
  {
    "id": "acc-jeff",
    "name": "Conta Corrente Jeff",
    "initial_balance": 0,
    "icon": "Landmark"
  },
  {
    "id": "acc-bel",
    "name": "Conta Corrente Bel",
    "initial_balance": 0,
    "icon": "Building"
  }
];

export const INITIAL_CATEGORIES = [
  {
    "id": "cat-alimentacao",
    "name": "Alimentação / Mercado / Lanches",
    "monthly_limit": 2500.0,
    "color": "#ef4444",
    "icon": "ShoppingCart"
  },
  {
    "id": "cat-lazer",
    "name": "Lazer e Lanches",
    "monthly_limit": 400.0,
    "color": "#f59e0b",
    "icon": "Smile"
  },
  {
    "id": "cat-gasolina",
    "name": "Gasolina / Transporte",
    "monthly_limit": 600.0,
    "color": "#3b82f6",
    "icon": "Fuel"
  },
  {
    "id": "cat-outros",
    "name": "Outros Flexíveis",
    "monthly_limit": 500.0,
    "color": "#8b5cf6",
    "icon": "MoreHorizontal"
  },
  {
    "id": "cat-moradia",
    "name": "Financiamento Apartamento",
    "monthly_limit": 3029.42,
    "color": "#10b981",
    "icon": "Home"
  },
  {
    "id": "cat-colegio",
    "name": "Colégio",
    "monthly_limit": 3000.0,
    "color": "#06b6d4",
    "icon": "GraduationCap"
  },
  {
    "id": "cat-saude",
    "name": "Rybelsius / Saúde",
    "monthly_limit": 599.0,
    "color": "#ec4899",
    "icon": "HeartPulse"
  },
  {
    "id": "cat-consorcio",
    "name": "Consórcio",
    "monthly_limit": 344.67,
    "color": "#6366f1",
    "icon": "Briefcase"
  },
  {
    "id": "cat-missao-kids",
    "name": "Ajuda Missão Kids",
    "monthly_limit": 400.0,
    "color": "#14b8a6",
    "icon": "Users"
  },
  {
    "id": "cat-internet",
    "name": "Internet",
    "monthly_limit": 109.99,
    "color": "#0284c7",
    "icon": "Wifi"
  },
  {
    "id": "cat-iptu",
    "name": "IPTU",
    "monthly_limit": 112.91,
    "color": "#64748b",
    "icon": "FileText"
  },
  {
    "id": "cat-condominio",
    "name": "Condomínio",
    "monthly_limit": 440.0,
    "color": "#84cc16",
    "icon": "Building2"
  },
  {
    "id": "cat-teclado",
    "name": "Aula Teclado",
    "monthly_limit": 125.0,
    "color": "#a855f7",
    "icon": "Music"
  },
  {
    "id": "cat-cabelo",
    "name": "Cabelo Jeff & Vicente",
    "monthly_limit": 90.0,
    "color": "#f97316",
    "icon": "Scissors"
  },
  {
    "id": "cat-luz",
    "name": "Luz",
    "monthly_limit": 300.0,
    "color": "#eab308",
    "icon": "Zap"
  },
  {
    "id": "cat-vivo",
    "name": "Vivo",
    "monthly_limit": 131.9,
    "color": "#9333ea",
    "icon": "Phone"
  },
  {
    "id": "cat-credicard",
    "name": "Cartão Credicard",
    "monthly_limit": 1700.0,
    "color": "#3b82f6",
    "icon": "CreditCard"
  },
  {
    "id": "cat-bradesco",
    "name": "Cartão Bradesco",
    "monthly_limit": 2250.0,
    "color": "#dc2626",
    "icon": "CreditCard"
  },
  {
    "id": "cat-psicologo",
    "name": "Psicólogo",
    "monthly_limit": 320.0,
    "color": "#14b8a6",
    "icon": "UserCheck"
  },
  {
    "id": "cat-thiago",
    "name": "Thiago (Empréstimo)",
    "monthly_limit": 250.0,
    "color": "#f43f5e",
    "icon": "Landmark"
  },
  {
    "id": "cat-duda",
    "name": "DUDA Renovação CNH",
    "monthly_limit": 200.0,
    "color": "#64748b",
    "icon": "Car"
  }
];

export const INITIAL_INCOMES = [
  {
    "id": "inc-1",
    "date": "2026-04-01",
    "description": "UFF",
    "predicted_amount": 11222.56,
    "actual_amount": 11222.56,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-2",
    "date": "2026-04-01",
    "description": "Ajuda remédio Bel",
    "predicted_amount": 400.0,
    "actual_amount": 400.0,
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-3",
    "date": "2026-04-01",
    "description": "Ajuda JJ",
    "predicted_amount": 300.0,
    "actual_amount": 300.0,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-4",
    "date": "2026-03-18",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "inc-5",
    "date": "2026-03-25",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "inc-31",
    "date": "2026-04-01",
    "description": "UFF",
    "predicted_amount": 11222.56,
    "actual_amount": 11222.56,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-32",
    "date": "2026-04-01",
    "description": "Ajuda remédio Bel",
    "predicted_amount": 400.0,
    "actual_amount": 400.0,
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-33",
    "date": "2026-04-01",
    "description": "Ajuda JJ",
    "predicted_amount": 300.0,
    "actual_amount": 300.0,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-34",
    "date": "2026-03-18",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "inc-35",
    "date": "2026-03-25",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "inc-60",
    "date": "2026-04-01",
    "description": "UFF",
    "predicted_amount": 11222.56,
    "actual_amount": 11222.56,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-61",
    "date": "2026-04-01",
    "description": "Ajuda remédio Bel",
    "predicted_amount": 400.0,
    "actual_amount": 400.0,
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-62",
    "date": "2026-04-01",
    "description": "Ajuda JJ",
    "predicted_amount": 300.0,
    "actual_amount": 300.0,
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "inc-63",
    "date": "2026-03-18",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "inc-64",
    "date": "2026-03-25",
    "description": "Verbo",
    "predicted_amount": 3000.0,
    "actual_amount": 3000.0,
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  }
];

export const INITIAL_EXPENSES = [
  {
    "id": "exp-6",
    "date": "2026-05-02",
    "description": "Audiometria Vicente",
    "category_id": "cat-outros",
    "predicted_amount": 300.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "REPOR VERBO"
  },
  {
    "id": "exp-7",
    "date": "2026-05-05",
    "description": "DUDA Renovação CNH Bel",
    "category_id": "cat-duda",
    "predicted_amount": 200.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-8",
    "date": "2026-05-05",
    "description": "Rybelsius",
    "category_id": "cat-saude",
    "predicted_amount": 599.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-9",
    "date": "2026-05-05",
    "description": "Caixinha/Reserva",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-10",
    "date": "2026-05-10",
    "description": "Thiago",
    "category_id": "cat-thiago",
    "predicted_amount": 250.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "3/12 de R$ 250 | PIX"
  },
  {
    "id": "exp-11",
    "date": "2026-05-10",
    "description": "Colégio",
    "category_id": "cat-outros",
    "predicted_amount": 3000.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-12",
    "date": "2026-05-10",
    "description": "Internet",
    "category_id": "cat-internet",
    "predicted_amount": 109.99,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-13",
    "date": "2026-05-10",
    "description": "Consórcio",
    "category_id": "cat-outros",
    "predicted_amount": 344.67,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-14",
    "date": "2026-05-10",
    "description": "Ajuda Missão Kids",
    "category_id": "cat-outros",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-15",
    "date": "2026-05-10",
    "description": "IPTU",
    "category_id": "cat-iptu",
    "predicted_amount": 112.91,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "PIX"
  },
  {
    "id": "exp-16",
    "date": "2026-05-10",
    "description": "Condomínio",
    "category_id": "cat-outros",
    "predicted_amount": 440.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-17",
    "date": "2026-05-10",
    "description": "Aula Teclado",
    "category_id": "cat-teclado",
    "predicted_amount": 125.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-18",
    "date": "2026-05-16",
    "description": "Financiamento Apartamento",
    "category_id": "cat-moradia",
    "predicted_amount": 3029.42,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-19",
    "date": "2026-05-20",
    "description": "Cabelo Jeff",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-20",
    "date": "2026-05-20",
    "description": "Cabelo Vicente",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-21",
    "date": "2026-05-20",
    "description": "Luz",
    "category_id": "cat-luz",
    "predicted_amount": 300.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-22",
    "date": "2026-05-20",
    "description": "Vivo",
    "category_id": "cat-vivo",
    "predicted_amount": 131.9,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-23",
    "date": "2026-05-24",
    "description": "Renner Bel",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": "2026-04-01 00:00:00"
  },
  {
    "id": "exp-24",
    "date": "2026-05-24",
    "description": "Cartão de Crédito - Credicard",
    "category_id": "cat-credicard",
    "predicted_amount": 1700.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ | Mentoria e Camera = R$ 1774,99"
  },
  {
    "id": "exp-25",
    "date": "2026-05-24",
    "description": "Cartão de Crédito - Bradesco",
    "category_id": "cat-bradesco",
    "predicted_amount": 2250.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ 3690,11 | Mentoria: 1145,83"
  },
  {
    "id": "exp-26",
    "date": "2026-05-30",
    "description": "Psicólogo",
    "category_id": "cat-outros",
    "predicted_amount": 320.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "06/04 R$ 160 | 18/04 R$ 160"
  },
  {
    "id": "exp-27",
    "date": "2026-05-10",
    "description": "Alimentação/Mercado/Lanches",
    "category_id": "cat-alimentacao",
    "predicted_amount": 2500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-28",
    "date": "2026-05-10",
    "description": "Lazer e Lanches",
    "category_id": "cat-lazer",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-29",
    "date": "2026-05-10",
    "description": "Gasolina",
    "category_id": "cat-gasolina",
    "predicted_amount": 600.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-30",
    "date": "2026-05-10",
    "description": "Outros",
    "category_id": "cat-outros",
    "predicted_amount": 500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "CONTANDO BRASILIA"
  },
  {
    "id": "exp-36",
    "date": "2026-06-05",
    "description": "DUDA Renovação CNH Bel",
    "category_id": "cat-duda",
    "predicted_amount": 200.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-37",
    "date": "2026-06-05",
    "description": "Rybelsius",
    "category_id": "cat-saude",
    "predicted_amount": 599.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-38",
    "date": "2026-06-05",
    "description": "Caixinha/Reserva",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-39",
    "date": "2026-06-10",
    "description": "Thiago",
    "category_id": "cat-thiago",
    "predicted_amount": 250.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-40",
    "date": "2026-06-10",
    "description": "Colégio",
    "category_id": "cat-outros",
    "predicted_amount": 3000.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-41",
    "date": "2026-06-10",
    "description": "Internet",
    "category_id": "cat-internet",
    "predicted_amount": 109.99,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-42",
    "date": "2026-06-10",
    "description": "Consórcio",
    "category_id": "cat-outros",
    "predicted_amount": 344.67,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-43",
    "date": "2026-06-10",
    "description": "Ajuda Missão Kids",
    "category_id": "cat-outros",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-44",
    "date": "2026-06-10",
    "description": "IPTU",
    "category_id": "cat-iptu",
    "predicted_amount": 112.91,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-45",
    "date": "2026-06-10",
    "description": "Condomínio",
    "category_id": "cat-outros",
    "predicted_amount": 440.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-46",
    "date": "2026-06-10",
    "description": "Aula Teclado",
    "category_id": "cat-teclado",
    "predicted_amount": 125.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-47",
    "date": "2026-06-16",
    "description": "Financiamento Apartamento",
    "category_id": "cat-moradia",
    "predicted_amount": 3029.42,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-48",
    "date": "2026-06-20",
    "description": "Cabelo Jeff",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-49",
    "date": "2026-06-20",
    "description": "Cabelo Vicente",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-50",
    "date": "2026-06-20",
    "description": "Luz",
    "category_id": "cat-luz",
    "predicted_amount": 300.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-51",
    "date": "2026-06-20",
    "description": "Vivo",
    "category_id": "cat-vivo",
    "predicted_amount": 131.9,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-52",
    "date": "2026-06-24",
    "description": "Renner Bel",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": "2026-04-01 00:00:00"
  },
  {
    "id": "exp-53",
    "date": "2026-06-24",
    "description": "Cartão de Crédito - Credicard",
    "category_id": "cat-credicard",
    "predicted_amount": 1700.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ | Mentoria e Camera = R$ 1774,99"
  },
  {
    "id": "exp-54",
    "date": "2026-06-24",
    "description": "Cartão de Crédito - Bradesco",
    "category_id": "cat-bradesco",
    "predicted_amount": 2250.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ 3690,11 | Mentoria: 1145,83"
  },
  {
    "id": "exp-55",
    "date": "2026-06-30",
    "description": "Psicólogo",
    "category_id": "cat-outros",
    "predicted_amount": 320.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "06/04 R$ 160 | 18/04 R$ 160"
  },
  {
    "id": "exp-56",
    "date": "2026-06-10",
    "description": "Alimentação/Mercado/Lanches",
    "category_id": "cat-alimentacao",
    "predicted_amount": 2500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-57",
    "date": "2026-06-10",
    "description": "Lazer e Lanches",
    "category_id": "cat-lazer",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-58",
    "date": "2026-06-10",
    "description": "Gasolina",
    "category_id": "cat-gasolina",
    "predicted_amount": 600.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-59",
    "date": "2026-06-10",
    "description": "Outros",
    "category_id": "cat-outros",
    "predicted_amount": 500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "CONTANDO BRASILIA"
  },
  {
    "id": "exp-65",
    "date": "2026-07-05",
    "description": "DUDA Renovação CNH Bel",
    "category_id": "cat-duda",
    "predicted_amount": 200.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-66",
    "date": "2026-07-05",
    "description": "Rybelsius",
    "category_id": "cat-saude",
    "predicted_amount": 599.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-67",
    "date": "2026-07-05",
    "description": "Caixinha/Reserva",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-68",
    "date": "2026-07-10",
    "description": "Thiago",
    "category_id": "cat-thiago",
    "predicted_amount": 250.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-69",
    "date": "2026-07-10",
    "description": "Colégio",
    "category_id": "cat-outros",
    "predicted_amount": 3000.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-70",
    "date": "2026-07-10",
    "description": "Internet",
    "category_id": "cat-internet",
    "predicted_amount": 109.99,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-71",
    "date": "2026-07-10",
    "description": "Consórcio",
    "category_id": "cat-outros",
    "predicted_amount": 344.67,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-72",
    "date": "2026-07-10",
    "description": "Ajuda Missão Kids",
    "category_id": "cat-outros",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-73",
    "date": "2026-07-10",
    "description": "IPTU",
    "category_id": "cat-iptu",
    "predicted_amount": 112.91,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-74",
    "date": "2026-07-10",
    "description": "Condomínio",
    "category_id": "cat-outros",
    "predicted_amount": 440.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-75",
    "date": "2026-07-10",
    "description": "Aula Teclado",
    "category_id": "cat-teclado",
    "predicted_amount": 125.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-76",
    "date": "2026-07-16",
    "description": "Financiamento Apartamento",
    "category_id": "cat-moradia",
    "predicted_amount": 3029.42,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-77",
    "date": "2026-07-20",
    "description": "Cabelo Jeff",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-78",
    "date": "2026-07-20",
    "description": "Cabelo Vicente",
    "category_id": "cat-cabelo",
    "predicted_amount": 45.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-79",
    "date": "2026-07-20",
    "description": "Luz",
    "category_id": "cat-luz",
    "predicted_amount": 300.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-80",
    "date": "2026-07-20",
    "description": "Vivo",
    "category_id": "cat-vivo",
    "predicted_amount": 131.9,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "ok",
    "notes": ""
  },
  {
    "id": "exp-81",
    "date": "2026-07-24",
    "description": "Renner Bel",
    "category_id": "cat-outros",
    "predicted_amount": 0.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-bel",
    "status": "pendente",
    "notes": "2026-04-01 00:00:00"
  },
  {
    "id": "exp-82",
    "date": "2026-07-24",
    "description": "Cartão de Crédito - Credicard",
    "category_id": "cat-credicard",
    "predicted_amount": 1700.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ | Mentoria e Camera = R$ 1774,99"
  },
  {
    "id": "exp-83",
    "date": "2026-07-24",
    "description": "Cartão de Crédito - Bradesco",
    "category_id": "cat-bradesco",
    "predicted_amount": 2250.0,
    "actual_amount": 0.0,
    "payment_method": "Cartão de Crédito",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "VALOR TOTAL: R$ 3690,11 | Mentoria: 1145,83"
  },
  {
    "id": "exp-84",
    "date": "2026-07-30",
    "description": "Psicólogo",
    "category_id": "cat-outros",
    "predicted_amount": 320.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "06/04 R$ 160 | 18/04 R$ 160"
  },
  {
    "id": "exp-85",
    "date": "2026-07-10",
    "description": "Alimentação/Mercado/Lanches",
    "category_id": "cat-alimentacao",
    "predicted_amount": 2500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-86",
    "date": "2026-07-10",
    "description": "Lazer e Lanches",
    "category_id": "cat-lazer",
    "predicted_amount": 400.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-87",
    "date": "2026-07-10",
    "description": "Gasolina",
    "category_id": "cat-gasolina",
    "predicted_amount": 600.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": ""
  },
  {
    "id": "exp-88",
    "date": "2026-07-10",
    "description": "Outros",
    "category_id": "cat-outros",
    "predicted_amount": 500.0,
    "actual_amount": 0.0,
    "payment_method": "PIX",
    "account_id": "acc-jeff",
    "status": "pendente",
    "notes": "CONTANDO BRASILIA"
  }
];
