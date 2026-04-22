# Chatbot - Hand Talk AST

Chatbot com telemetria avançada e WebSocket + IA para o desafio técnico da Hand Talk.

## Stack

- **Backend**: NestJS + PostgreSQL + Socket.io + Puter.js
- **Frontend**: Next.js 15 + Shadcn

## Como Rodar

### 1. Inicie os containers

```bash
docker-compose up -d
```

## Acessar

| Serviço     | URL                       |
| ----------- | ------------------------- |
| Frontend    | http://localhost:3000     |
| Backend API | http://localhost:3001/api |

## Primeiros passos

Ao acessar o frontend clique em Começar Agora, você será redirecionado a tela de Autenticação.

### Login Usuário

Faça o cadastro clicando em Criar Conta com dados de nome, email e senha. Após isso faça o login com os dados cadastrados.

### Login Admin

Faça o login com os seguintes dados:

- **Email**: admin@handtalk.com
- **Password**: admin123

## Parar

```bash
docker-compose down
```

Para remover o banco de dados:

```bash
docker-compose down -v
```
