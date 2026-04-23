# Calculadora DIFAL — O Fazendeiro

Plataforma de análise de DIFAL para operações MG → consumidor final não contribuinte.

## Arquitetura

- **Camada 1:** Convênios nacionais CONFAZ hard-coded (Conv.52/91) — resultado instantâneo
- **Camada 2:** Busca de legislação estadual via IA + web search (Claude Sonnet)
- **Camada 3:** Memória de cálculo passo a passo, exportável em CSV

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (pode logar com o próprio GitHub)
- Chave de API Anthropic: [console.anthropic.com](https://console.anthropic.com/settings/keys)

---

## 1. Rodar localmente

```bash
# Clone o repositório (após criar no GitHub)
git clone https://github.com/SEU_USUARIO/difal-fazendeiro.git
cd difal-fazendeiro

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env

# Edite o .env e coloque sua chave Anthropic
# VITE_ANTHROPIC_API_KEY=sk-ant-...

# Rode em desenvolvimento
npm run dev
# Acesse: http://localhost:5173
```

---

## 2. Subir no GitHub

### Opção A — Via terminal (recomendado)

```bash
# Na pasta do projeto
git init
git add .
git commit -m "feat: calculadora DIFAL v3 - 3 camadas de análise"

# Crie o repositório no GitHub (github.com → New repository)
# Nome sugerido: difal-fazendeiro
# Deixe PRIVADO (contém lógica de negócio)
# NÃO inicialize com README (já temos)

# Conecte e suba
git remote add origin https://github.com/SEU_USUARIO/difal-fazendeiro.git
git branch -M main
git push -u origin main
```

### Opção B — Via GitHub Desktop

1. Abra o GitHub Desktop
2. File → Add Local Repository → selecione a pasta `difal-fazendeiro`
3. Publish repository → marque **Keep this code private**
4. Publish

---

## 3. Deploy no Vercel

### 3.1 Conectar o repositório

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Clique em **Import Git Repository**
3. Selecione `difal-fazendeiro`
4. Framework Preset: **Vite** (detectado automaticamente)
5. **NÃO clique em Deploy ainda** — primeiro configure a variável de ambiente

### 3.2 Configurar a chave da API

Na mesma tela de import, clique em **Environment Variables** e adicione:

| Name | Value |
|------|-------|
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-sua-chave-aqui` |

### 3.3 Deploy

Clique em **Deploy**. Em ~1 minuto a aplicação estará disponível em:
```
https://difal-fazendeiro.vercel.app
```

---

## 4. Atualizar após mudanças

Qualquer `git push` para `main` aciona um novo deploy automático no Vercel.

```bash
# Após editar arquivos
git add .
git commit -m "fix: ajuste na base de NCMs do Conv.52/91"
git push
# Vercel faz o deploy automaticamente em ~30s
```

---

## 5. Domínio personalizado (opcional)

No Vercel → projeto → **Settings → Domains**:
- Adicione `difal.ofazendeiro.com.br` (ou o domínio que tiverem)
- O Vercel gera os registros DNS — configure no seu provedor de domínio

---

## Segurança

- A chave `VITE_ANTHROPIC_API_KEY` fica nas variáveis de ambiente do Vercel, **não no código**
- O repositório deve ser **privado** no GitHub
- O arquivo `.env` está no `.gitignore` e nunca vai para o repositório

## Estrutura do projeto

```
difal-fazendeiro/
├── src/
│   ├── App.jsx        # Componente principal — toda a lógica
│   └── main.jsx       # Entry point React
├── index.html
├── vite.config.js
├── package.json
├── .env.example       # Template — copie para .env e preencha
└── .gitignore
```
