# Canal Confidencial Grupo Prante

Sistema web completo para ouvidoria interna, com foco em confiabilidade, anonimato, rastreabilidade e tratamento estruturado dos relatos.

## Visao geral

- Frontend em React + TailwindCSS com visual institucional e responsivo
- Backend em Node.js + Express com arquitetura organizada por camadas
- Banco SQLite para armazenamento local simples e estruturado
- Upload opcional de arquivos
- Envio automatico de e-mail com Nodemailer
- Painel administrativo com login simples, filtros e atualizacao de status

## Estrutura

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- routes
|   |   |-- services
|   |   `-- utils
|   `-- uploads
|-- frontend
|   `-- src
`-- .env.example
```

## Como rodar localmente

### 1. Pre-requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado

### 2. Instale as dependencias

Na raiz do projeto:

```bash
npm install
npm run install:all
```

### 3. Configure as variaveis de ambiente

Copie o arquivo `.env.example` para `.env` na raiz:

```bash
cp .env.example .env
```

Preencha especialmente:

- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### 4. Execute em desenvolvimento

```bash
npm run dev
```

Aplicacoes:

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:4000`

### 5. Build de producao

```bash
npm run build
npm run start
```

O backend serve a pasta `frontend/dist` automaticamente quando ela existir.

## Configuracao de e-mail

O envio usa Nodemailer com SMTP tradicional. Exemplo:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu.usuario
SMTP_PASS=sua.senha
EMAIL_FROM=canalconfidencial@grupoprante.com.br
EMAIL_TO=ouvidoria@grupoprante.com.br
```

Se o SMTP nao estiver configurado, o sistema continua registrando os relatos no banco, mas o envio de e-mail falhara e sera informado no log do servidor.

## Deploy

### Opcao 1: VPS ou servidor Windows/Linux

1. Instale Node.js
2. Configure `.env`
3. Rode `npm install`
4. Rode `npm run install:all`
5. Rode `npm run build`
6. Inicie com `npm run start`
7. Opcionalmente use PM2, NSSM ou servico do sistema

### Opcao 2: Frontend em Vercel + backend separado

- Publicar o frontend em Vercel
- Hospedar o backend em Render, Railway ou VPS
- Ajustar `VITE_API_URL` no frontend para apontar ao backend publicado
- Manter SQLite em volume persistente, ou migrar para PostgreSQL em producao

## Credenciais do painel

O login administrativo usa:

- Usuario: `ADMIN_USER`
- Senha: `ADMIN_PASSWORD`

Painel: `http://localhost:5173/admin`

## Principais rotas da API

- `POST /api/reports`
- `POST /api/auth/login`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id/status`
- `GET /api/health`

## Melhorias futuras sugeridas

- Captcha invisivel ou hCaptcha
- Auditoria de alteracoes de status
- Historico de interacoes por relato
- Notificacoes por Teams ou Slack
- Migracao para PostgreSQL
- Permissoes com multiplos perfis administrativos
- Dashboard com metricas e SLA

## Observacao importante

O ambiente desta sessao nao possui `node` e `npm` disponiveis no `PATH`, entao eu deixei o projeto completo no codigo, mas nao consegui instalar dependencias nem executar a aplicacao localmente aqui. Assim que o Node estiver disponivel na maquina, os passos acima permitem rodar e validar a solucao.
