# rifa-carlos

Sistema de rifa solidária com Next.js, Neon (PostgreSQL) e Vercel.

## 🚀 Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais reais

# 3. Instalar os Git hooks de segurança
pwsh scripts/install-hooks.ps1
# ou: git config core.hooksPath .githooks

# 4. Inicializar o banco de dados
node scripts/init-db.mjs   # precisa de DATABASE_URL no .env.local

# 5. Rodar em desenvolvimento
npm run dev
```

## 🔒 Segurança

Este repositório possui um **pre-commit hook** que varre arquivos staged em busca de:

- Connection strings no formato `SEU_STRING_DE_CONEXAO_AQUI`
- Senhas prefixadas com `npg_` (Neon)
- Atribuicoes do tipo `SENHA="valor_literal"`
- Tokens JWT, API keys e secrets hardcoded

**NUNCA** commite arquivos `.env*` com credenciais reais.

## 🧪 Testes

```bash
# Testes: defina ADMIN_PASSWORD no .env.local
node tests/test-admin.mjs
node tests/test-api-flow.mjs
node tests/test-public.mjs
```

## 📁 Scripts

| Script | Descrição |
|--------|-----------|
| `scripts/init-db.mjs` | Inicializa o banco com schema SQL |
| `scripts/check.mjs` | Verifica estado do banco |
| `scripts/check-price.mjs` | Checa preços |
| `scripts/reset-test.mjs` | Reseta dados de teste |
| `scripts/migrate-200.mjs` | Migração específica |
| `scripts/install-hooks.ps1` | Instala hooks de segurança |
