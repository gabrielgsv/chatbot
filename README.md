# Chatbot - Hand Talk AST

Chatbot com telemetria avançada e WebSocket + IA para o desafio técnico da Hand Talk.

## Stack

- **Backend**: NestJS + PostgreSQL + Socket.io + OpenAI
- **Frontend**: Next.js 15 + Shadcn

## Como Rodar

### 1. Configure as variáveis de ambiente

`chatbot-backend/.env`:

```env
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=chatbot
DB_SSL=false
DB_SYNCHRONIZE=true

JWT_SECRET=*seu secret aqui*
NVIDIA_API_KEY=sk-mock
ALLOWED_ORIGINS=http://localhost:3000
```

`chatbot-frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Inicie os containers

```bash
docker-compose -f docker-compose.local.yml up -d
```

## Acessar

| Serviço     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:3001 |

### Login

- **Email**: admin@handtalk.com
- **Password**: admin123

## Parar

```bash
docker-compose -f docker-compose.local.yml down
```

Para remover o banco de dados:

```bash
docker-compose -f docker-compose.local.yml down -v
```
