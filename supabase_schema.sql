-- SCRIPT SQL PARA O SUPABASE (Cole no SQL Editor do seu projeto Supabase)

-- 1. Tabela de Perfis / Orçamentos do Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income NUMERIC DEFAULT 0,
  available_cash NUMERIC DEFAULT 0,
  limit_essentials NUMERIC DEFAULT 0,
  limit_lifestyle NUMERIC DEFAULT 0,
  limit_savings NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários só podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários só podem inserir seu próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tabela de Cartões de Crédito (com Reserva de Liquidez YNAB)
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  limit_amount NUMERIC DEFAULT 0,
  closing_day INT DEFAULT 1,
  due_day INT DEFAULT 10,
  color TEXT DEFAULT '#4f46e5',
  reserved_cash NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só podem ver seus cartões" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários só podem criar seus cartões" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários só podem atualizar seus cartões" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários só podem deletar seus cartões" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- 3. Tabela de Categorias Personalizadas (com ZBB & Sinking Funds / Reservas de Aderência)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  macro_category TEXT NOT NULL CHECK (macro_category IN ('essentials', 'lifestyle', 'savings', 'debts')),
  budget_limit NUMERIC DEFAULT 0,
  allocated_amount NUMERIC DEFAULT 0,
  is_sinking_fund BOOLEAN DEFAULT FALSE,
  target_amount NUMERIC DEFAULT 0,
  target_date DATE DEFAULT NULL,
  icon TEXT DEFAULT 'tag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias categorias" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias categorias" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias categorias" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias categorias" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- 4. Tabela de Transações (com Cartão de Crédito, Parcelamento e Deduplicação Hash SHA-256)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('essentials', 'lifestyle', 'savings', 'debts')),
  sub_category TEXT DEFAULT 'Geral',
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  installment_info TEXT DEFAULT NULL,
  hash_sha256 TEXT DEFAULT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias transações" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir apenas suas próprias transações" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar apenas suas próprias transações" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar apenas suas próprias transações" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 5. Tabela de Gastos Recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('essentials', 'lifestyle', 'savings', 'debts')),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus gastos recorrentes" ON public.recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir apenas seus gastos recorrentes" ON public.recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar apenas seus gastos recorrentes" ON public.recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar apenas seus gastos recorrentes" ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- 6. Tabela de Dívidas e Empréstimos (com Taxa de Juros para Método Avalancha)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  monthly_payment NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  due_day INT DEFAULT 10,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias dívidas" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir apenas suas próprias dívidas" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar apenas suas próprias dívidas" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar apenas suas próprias dívidas" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- Trigger Automático para criar perfil ao se registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, monthly_income, available_cash, limit_essentials, limit_lifestyle, limit_savings)
  VALUES (new.id, 0, 0, 0, 0, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

