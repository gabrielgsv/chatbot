# Debug do Service Worker

O token de autenticação agora é armazenado no Service Worker, não no localStorage.

## Como Debugar

### 1. Console do Navegador
Abra DevTools (F12) → Console. Você verá logs como:
```
[SW] Instalando...
[SW] Ativado!
[AuthForm] SW registrado. Pronto: true
[SW] Token armazenado
[SW] Debug status: {hasToken: true, tokenPreview: "eyJhbGciOiJIUzI..."}
```

### 2. DevTools → Application → Service Workers
- Veja se o SW está "Activated and is running"
- Clique em "Inspect" para ver o console isolado do SW
- Clique em "Unregister" para forçar reinstalação

### 3. DevTools → Application → Cache Storage
- Expanda "Cache Storage"
- Clique em "v1" (nome do cache)
- Veja as entradas armazenadas (token, user)

### 4. DevTools → Console (comandos manuais)
```javascript
// Verificar status do SW
navigator.serviceWorker.controller?.postMessage({type: 'DEBUG_STATUS'})

// Ver todos os caches
caches.keys().then(keys => console.log('Caches:', keys))

// Limpar cache do SW
caches.delete('v1').then(() => console.log('Cache v1 deletado'))
```

### 5. Network Tab
As requisições para a API agora são automaticamente interceptadas pelo SW e o token é adicionado no header `Authorization: Bearer <token>`.

## Vantagens vs localStorage

| Aspecto | localStorage | Service Worker |
|---------|-------------|----------------|
| XSS | ❌ Vulnerável | ✅ Protegido |
| Persistência | ✅ Permanente | ✅ Permanente |
| Debug fácil | ✅ Sim | ✅ Sim (via DevTools) |
| Tamanho | ~5MB | Dependendo do navegador |
| CSRF | ✅ Não envia automaticamente | ✅ Não envia (adicionamos via SW) |

## Comandos Úteis

```javascript
// No console do navegador (página principal):

// Ver se SW está controlando
console.log('SW ready:', navigator.serviceWorker?.controller !== null)

// Forçar update
navigator.serviceWorker.getRegistration().then(reg => reg?.update())

// Limpar tudo
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
)
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
```
