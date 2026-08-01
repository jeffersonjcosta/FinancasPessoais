# 🚦 Semáforo Financeiro - Gestão Pessoal Inteligente

Aplicação PWA (Progressive Web App) para gestão de finanças pessoais focada em controle de velocidade de gastos (Burndown Rate) e alertas visuais de "freio" de orçamento.

![Semáforo Financeiro](https://img.shields.io/badge/PWA-Ready-10b981?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge)

---

## 📌 Principais Recursos

1. **Semáforo Alerta (Verde / Amarelo / Vermelho):**
   * Calcula o **Limite Diário Seguro** para a categoria de *Estilo de Vida* (gastos flexíveis).
   * Alerta quando sua velocidade média diária ultrapassar o limite seguro, mostrando avisos claros para **FREAR** os gastos.
2. **Método 50 / 30 / 20:**
   * **50% Essenciais:** Sobrevivência (aluguel, mercado, contas).
   * **30% Estilo de Vida:** Lazer, delivery, compras (monitorado pelo Semáforo).
   * **20% Futuro:** Reservas e investimentos.
3. **Lançamento Rápido:**
   * Predefinições de 1 clique (Café R$ 5, Almoço R$ 35, Mercado R$ 100, Uber R$ 20).
4. **Despesas Recorrentes:**
   * Cadastro de assinaturas e despesas fixas com dia de vencimento.
5. **Segurança em Nuvem com Supabase:**
   * Login e Senha privados.
   * Banco de dados PostgreSQL com **Row Level Security (RLS)** — seus dados só pertencem a você.
6. **Backup Local:**
   * Exportação e importação de backups em formato JSON a qualquer momento.
7. **PWA Instalável:**
   * Pode ser instalado na tela de início do seu celular (iOS/Android) como um app nativo.

---

## 🛠️ Como Configurar o Supabase (Passo a Passo)

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta gratuita.
2. Crie um novo projeto chamado `financas-semaforo`.
3. No painel do projeto, vá em **SQL Editor** -> **New Query**.
4. Copie o conteúdo do arquivo [`supabase_schema.sql`](./supabase_schema.sql) deste repositório, cole no SQL Editor e clique em **Run**.
5. Em **Project Settings** -> **API**, copie a **Project URL** e a **anon key**.
6. Crie um arquivo `.env.local` na raiz do projeto com as chaves:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```
   *(Ou insira essas chaves diretamente na tela de **Ajustes** do aplicativo).*

---

## 🚀 Como Publicar no GitHub Pages

1. Crie um repositório no GitHub chamado `financas-semaforo`.
2. No seu terminal local, execute:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Semáforo Financeiro PWA"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/financas-semaforo.git
   git push -u origin main
   ```
3. Para publicar no GitHub Pages:
   ```bash
   cmd /c npm run deploy
   ```
4. No GitHub, acesse seu repositório -> **Settings** -> **Pages** e selecione a branch `gh-pages`. Seu aplicativo estará no ar em minutos!
