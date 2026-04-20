# Chatbot de Coleta de Dados - Hand Talk AST

Aplicação de chatbot com telemetria avançada para coleta massiva de dados de interação do usuário.

## 🎯 Objetivo

Este projeto foi desenvolvido como desafio técnico para a Hand Talk. O sistema consiste em:

- **Backend (NestJS + PostgreSQL)**: API centralizada com autenticação JWT, ingestão de eventos de telemetria e chat com WebSocket + IA
- **Frontend (Next.js + HeroUI)**: Interface de chat com coleta silenciosa de dados comportamentais

## 🏗️ Arquitetura

### Backend - `chatbot-backend/`

| Módulo            | Descrição                                 |
| ----------------- | ----------------------------------------- |
| `AuthModule`      | Autenticação JWT (signup/login)           |
| `TelemetryModule` | Ingestão em lote de eventos de telemetria |
| `ChatModule`      | WebSocket (Socket.io) + integração OpenAI |
| `UsersModule`     | Gestão de usuários                        |

**Endpoints HTTP:**

- `POST /users/signup` - Criar conta
- `POST /users/login` - Autenticar e receber JWT
- `POST /telemetry/batch` - Enviar eventos em lote (JWT obrigatório)
- `GET /telemetry/events` - Consultar eventos do usuário
- `GET /telemetry/stats` - Estatísticas de telemetria

**WebSocket Events (`/chat`):**

- `chat:message` - Enviar mensagem
- `chat:response` - Receber resposta da IA
- `chat:typing` - Indicador de digitação
- `chat:history` - Histórico de mensagens

### Frontend - `chatbot-frontend/`

- **Página Inicial** (`/`): Landing page com CTA
- **Autenticação** (`/auth`): Login e cadastro
- **Chat** (`/chat`): Interface de chat com telemetria

## 📊 Estratégia de Curadoria de Dados

Nossa telemetria coleta os seguintes eventos comportamentais:

### Eventos de Digitação

- `typing_start/end` - Tempo total digitando e WPM estimado
- `typing_pause` - Pausas > 2 segundos (indica hesitação)
- `message_edit` - Edições antes de enviar
- `message_clear` - Mensagens apagadas (desistência)

### Eventos de Interação

- `scroll_velocity` - Velocidade de scroll no chat
- `click_heatmap` - Cliques na interface (elemento, posição)
- `time_on_page` - Tempo total na conversa
- `tab_switch` - Alternância de abas (distração)

### Eventos de Contexto

- `device_info` - Dispositivo, resolução, timezone
- `connection_quality` - Latência de rede estimada
- `session_start/end` - Início e fim da sessão
- `message_sent/received` - Métricas de mensagens

### Strategy: Batching

- Buffer de até 50 eventos ou 30 segundos
- Envio automático em lote para não sobrecarregar
- Retry com exponential backoff
- Fallback com `navigator.sendBeacon` no unload

## 🛠️ Stack Tecnológica

| Camada    | Tecnologia                                  |
| --------- | ------------------------------------------- |
| Backend   | NestJS, TypeScript, PostgreSQL, TypeORM     |
| Frontend  | Next.js 15, React 19, HeroUI v3, TypeScript |
| Real-time | Socket.io (WebSocket)                       |
| IA        | OpenAI GPT-4o-mini                          |
| Infra     | Docker, docker-compose                      |

## 🚀 Como Executar

### Requisitos

- Node.js 20+
- Docker e Docker Compose
- Chave de API da OpenAI (opcional - fallback para mock)

### 1. Iniciar Banco de Dados

```bash
cd chatbot-backend
docker-compose up -d postgres
```

### 2. Configurar Variáveis de Ambiente

Backend (`chatbot-backend/.env`):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=chatbot
DB_SYNCHRONIZE=false

# JWT
JWT_SECRET=your-secret-key-here

# OpenAI (opcional)
OPENAI_API_KEY=sk-your-key-here
```

Frontend (`chatbot-frontend/.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Executar Backend

```bash
cd chatbot-backend
npm install
npm run db:sync  # Primeira vez: criar tabelas
npm run start:dev
```

### 4. Executar Frontend

```bash
cd chatbot-frontend
npm install
npm run dev
```

### 5. Acessar Aplicação

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Documentação API: http://localhost:3001/api

## 🌟 Diferenciais Implementados

1. ✅ **Batching no Frontend**: Telemetria em lotes com buffer inteligente
2. ✅ **WebSockets**: Chat real-time com Socket.io
3. ✅ **Acessibilidade (WCAG)**: ARIA labels, navegação por teclado, contraste adequado
4. ✅ **Integração com IA**: OpenAI GPT-4o-mini com fallback para respostas mockadas
5. ✅ **Estratégia de Curadoria**: 15+ tipos de eventos comportamentais rastreados

## 🧪 Testes

```bash
# Backend
cd chatbot-backend
npm run test

# Frontend
cd chatbot-frontend
npm run test
```

## 📁 Estrutura do Projeto

```
Chatbot/
├── chatbot-backend/          # NestJS API
│   ├── src/
│   │   ├── auth/            # Autenticação JWT
│   │   ├── chat/            # WebSocket + IA
│   │   ├── telemetry/       # Coleta de eventos
│   │   ├── users/           # Gestão de usuários
│   │   └── database/        # Config PostgreSQL
│   └── docker-compose.yaml   # Infra Docker
│
├── chatbot-frontend/         # Next.js App
│   ├── app/
│   │   ├── auth/            # Página de login/signup
│   │   ├── chat/            # Interface de chat
│   │   └── page.tsx         # Landing page
│   └── lib/
│       ├── telemetry.ts     # Serviço de telemetria
│       └── chat.ts          # Cliente WebSocket
│
└── README.md
```

## 📝 Notas de Decisão

### Por que PostgreSQL?

Escolhido por ser um banco relacional robusto com suporte a JSONB para armazenar metadados flexíveis dos eventos de telemetria. Índices compostos permitem queries eficientes por usuário, tipo de evento e timestamp.

### Por que WebSockets?

Implementados para demonstrar comunicação real-time, essencial para experiência de chat fluida. O HTTP continua sendo usado para os lotes de telemetria (mais eficiente para batching).

### Estratégia de Telemetria

Os eventos foram escolhidos pensando em:

- **Treinamento de IA**: Padrões de digitação, hesitações, clarões
- **Analytics de Produto**: Tempo de engajamento, funcionalidades mais usadas
- **Acessibilidade**: Tipos de dispositivos, necessidades de adaptação

## 📧 Contato

Desenvolvido para o desafio técnico Hand Talk - Esquadrão de Coleta de Dados.
