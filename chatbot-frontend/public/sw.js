// Service Worker para gerenciamento seguro de tokens
// Debug: DevTools → Application → Service Workers

const SW_VERSION = 'v1';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado!');
  event.waitUntil(self.clients.claim());
});

// Comunicação com a aplicação (postMessage)
self.addEventListener('message', async (event) => {
  console.log('[SW] Mensagem raw recebida:', event.data);
  console.log('[SW] Ports disponíveis:', event.ports?.length);

  // Quando usa MessageChannel, a resposta deve ser via event.ports[0]
  const responsePort = event.ports && event.ports[0] ? event.ports[0] : event.source;

  if (!responsePort) {
    console.error('[SW] Nenhuma porta de resposta disponível (ports[0] nem source)');
    return;
  }

  const { type, payload } = event.data || {};

  if (!type) {
    console.error('[SW] Mensagem sem type');
    responsePort.postMessage({ type: 'ERROR', message: 'Mensagem sem type' });
    return;
  }

  console.log('[SW] Processando mensagem:', type, payload);

  try {
    switch (type) {
      case 'SET_TOKEN':
        await setToken(payload?.token, payload?.user);
        responsePort.postMessage({
          type: 'TOKEN_SET',
          success: true,
          debug: { tokenPreview: payload?.token?.substring(0, 10) + '...' }
        });
        console.log('[SW] Resposta TOKEN_SET enviada via', event.ports?.[0] ? 'ports[0]' : 'source');
        break;

      case 'GET_TOKEN':
        const token = await getToken();
        const user = await getUser();
        responsePort.postMessage({
          type: 'TOKEN_VALUE',
          token,
          user,
          debug: { hasToken: !!token }
        });
        console.log('[SW] Resposta TOKEN_VALUE enviada');
        break;

      case 'CLEAR_TOKEN':
        await clearToken();
        responsePort.postMessage({ type: 'TOKEN_CLEARED' });
        console.log('[SW] Resposta TOKEN_CLEARED enviada');
        break;

      case 'DEBUG_STATUS':
        const debugToken = await getToken();
        responsePort.postMessage({
          type: 'DEBUG_INFO',
          hasToken: !!debugToken,
          tokenPreview: debugToken ? debugToken.substring(0, 15) + '...' : null,
          timestamp: new Date().toISOString(),
        });
        console.log('[SW] Resposta DEBUG_INFO enviada');
        break;

      case 'SKIP_WAITING':
        self.skipWaiting();
        responsePort.postMessage({ type: 'SKIP_WAITING_OK' });
        break;

      default:
        console.warn('[SW] Tipo de mensagem desconhecido:', type);
        responsePort.postMessage({ type: 'ERROR', message: 'Tipo desconhecido: ' + type });
    }
  } catch (error) {
    console.error('[SW] Erro processando mensagem:', error);
    responsePort.postMessage({ type: 'ERROR', message: error.message });
  }
});

// Interceptar requisições fetch e adicionar o token automaticamente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só intercepta requisições para a API
  if (url.pathname.startsWith('/api') || url.port === '3000') {
    event.respondWith(handleAPIRequest(request));
  }
});

async function handleAPIRequest(request) {
  try {
    const token = await getToken();

    if (token) {
      // Clone a requisição para adicionar o header
      const newHeaders = new Headers(request.headers);
      newHeaders.set('Authorization', `Bearer ${token}`);

      const newRequest = new Request(request, {
        headers: newHeaders,
      });

      console.log('[SW] Adicionando token à requisição:', request.url);
      return fetch(newRequest);
    }

    return fetch(request);
  } catch (error) {
    console.error('[SW] Erro ao interceptar requisição:', error);
    return fetch(request);
  }
}

// Armazenamento usando Cache API (acessível só dentro do SW)
async function setToken(token, user) {
  const cache = await caches.open(SW_VERSION);
  const tokenData = new Response(JSON.stringify({ token, user, timestamp: Date.now() }));
  await cache.put(TOKEN_KEY, tokenData);
  console.log('[SW] Token armazenado');
}

async function getToken() {
  try {
    const cache = await caches.open(SW_VERSION);
    const response = await cache.match(TOKEN_KEY);
    if (!response) return null;

    const data = await response.json();
    return data.token;
  } catch (error) {
    return null;
  }
}

async function getUser() {
  try {
    const cache = await caches.open(SW_VERSION);
    const response = await cache.match(TOKEN_KEY);
    if (!response) return null;

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}

async function clearToken() {
  const cache = await caches.open(SW_VERSION);
  await cache.delete(TOKEN_KEY);
  console.log('[SW] Token removido');
}

console.log('[SW] Service Worker carregado');
