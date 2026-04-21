# Especificação Técnica - Chatbot de Coleta de Dados AST

## Resumo
Chatbot com telemetria avançada para coleta massiva de dados de interação do usuário, usando NestJS + PostgreSQL no backend e Next.js + HeroUI no frontend, com WebSockets para chat real-time e integração com IA.

---

## Arquitetura

### Backend (NestJS + PostgreSQL)

| Módulo | Responsabilidade |
|--------|------------------|
| `AuthModule` | Registro, login, JWT |
| `TelemetryModule` | Ingestão de eventos em lote |
| `ChatModule` | WebSocket gateway para chat real-time |
| `DataModule` | Consulta de dados coletados |

**Endpoints HTTP:**
- `POST /auth/signup` - Criar conta
- `POST /auth/login` - Autenticar e receber JWT
- `POST /telemetry/batch` - Enviar eventos em lote (JWT obrigatório)
- `GET /data/events` - Listar eventos do usuário (filtros: tipo, data)

**WebSocket Events:**
- `chat:message` - Enviar mensagem
- `chat:response` - Receber resposta da IA
- `chat:typing` - Indicador de digitação

**Schema PostgreSQL:**
```sql
users (id, email, password_hash, created_at)
events (id, user_id, event_type, timestamp, metadata_json, session_id)
messages (id, user_id, content, role, timestamp, session_id)
```

### Frontend (Next.js + HeroUI)

| Página | Funcionalidade |
|--------|---------------|
| `/login` | Formulário de autenticação |
| `/chat` | Interface de chat real-time |

**Telemetria Implementada (Estratégia de Curadoria):**
1. **Eventos de Digitação:**
   - `typing_start` / `typing_end` - Tempo total digitando
   - `typing_pause` - Pausas durante digitação (>2s)
   - `message_edit` - Mensagens editadas antes de enviar
   - `message_clear` - Mensagens apagadas antes de enviar

2. **Eventos de Interação:**
   - `scroll_velocity` - Velocidade de scroll no chat
   - `click_heatmap` - Cliques na interface (elemento, posição)
   - `time_on_page` - Tempo total na conversa
   - `tab_switch` - Alternância de abas durante chat

3. **Eventos de Contexto:**
   - `device_info` - Dispositivo, resolução, timezone
   - `connection_quality` - Latência de rede estimada
   - `session_start` / `session_end`

**Batching Strategy:**
- Buffer de eventos no frontend (máx 50 eventos ou 30s)
- Envio automático em lote para não sobrecarregar
- Retry com exponential backoff

### Integração com IA
- **Provider:** OpenAI GPT-4o-mini (ou Claude se preferir)
- **Implementação:** API REST no backend
- **Cache:** Redis para respostas frequentes
- **Rate Limit:** 10 req/min por usuário

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS, TypeScript, PostgreSQL, TypeORM |
| Frontend | Next.js 15, React 19, HeroUI, TypeScript |
| Real-time | Socket.io (WebSocket) |
| IA | OpenAI API |
| Cache | Redis |
| Infra | Docker, docker-compose |

---

## Diferenciais Implementados

1. ✅ **Batching no Frontend** - Telemetria em lotes
2. ✅ **WebSockets** - Chat real-time
3. ✅ **Acessibilidade** - WCAG 2.1 AA (ARIA labels, contraste, navegação por teclado)
4. ✅ **Observabilidade** - Logs estruturados com Pino

---

## Plano de Implementação

### Fase 1: Backend Core (2h)
- [ ] Setup PostgreSQL + TypeORM
- [ ] AuthModule (signup/login/JWT)
- [ ] TelemetryModule (batch ingestion)
- [ ] DataModule (query endpoint)

### Fase 2: WebSocket + IA (2h)
- [ ] ChatGateway (Socket.io)
- [ ] OpenAI integration
- [ ] Redis cache setup

### Fase 3: Frontend (3h)
- [ ] Auth pages (login/signup)
- [ ] Chat interface
- [ ] Telemetry service
- [ ] Batching logic

### Fase 4: Acessibilidade + Polimento (1h)
- [ ] ARIA labels e navegação
- [ ] Testes unitários
- [ ] Docker compose final

---

## Como Executar

```bash
# Iniciar tudo
docker-compose up -d

# Backend
cd chatbot-backend && npm run start:dev

# Frontend  
cd chatbot-frontend && npm run dev
```
