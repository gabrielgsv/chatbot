// Utilitário para comunicação com o Service Worker
// Permite debugar tokens no DevTools → Application → Service Workers

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker não suportado');
    return null;
  }

  try {
    // Registra o SW
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    // Aguarda o SW estar ativo e controlando
    await waitForSWActive(registration);

    console.log('[SW] Service Worker ativo e controlando:', navigator.serviceWorker.controller?.scriptURL);

    // Listener para mensagens do SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW] Mensagem do SW:', event.data);
    });

    return registration;
  } catch (error) {
    console.error('[SW] Erro ao registrar:', error);
    return null;
  }
}

// Aguarda o SW estar ativo e controlando a página
async function waitForSWActive(registration: ServiceWorkerRegistration): Promise<void> {
  // Se já tem controller, está pronto
  if (navigator.serviceWorker.controller) {
    return;
  }

  // Aguarda o SW novo estar instalado
  if (registration.installing) {
    console.log('[SW] Aguardando instalação...');
    await new Promise<void>((resolve) => {
      registration.installing?.addEventListener('statechange', function() {
        if (this.state === 'activated') {
          resolve();
        }
      });
    });
  }

  // Força o skipWaiting para ativar imediatamente
  if (registration.waiting) {
    console.log('[SW] Ativando SW pendente...');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Aguarda o controllerchange
  if (!navigator.serviceWorker.controller) {
    console.log('[SW] Aguardando controller...');
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller ativo!');
        resolve();
      });
    });
  }
}

// Aguarda o controller do SW estar disponível
async function waitForController(timeout = 10000): Promise<void> {
  if (navigator.serviceWorker.controller) {
    return;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout aguardando controller do SW'));
    }, timeout);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        clearTimeout(timeoutId);
        resolve();
      }
    });
  });
}

// Envia mensagem para o SW e aguarda resposta
async function sendMessageToSW<T>(type: string, payload?: unknown): Promise<T> {
  // Aguarda o controller estar pronto
  await waitForController();

  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('Service Worker não está controlando a página'));
      return;
    }

    console.log('[SW] Preparando MessageChannel para:', type);

    const channel = new MessageChannel();
    let resolved = false;
    
    channel.port1.onmessage = (event) => {
      if (!resolved) {
        resolved = true;
        console.log('[SW] Resposta recebida:', event.data);
        resolve(event.data as T);
      }
    };

    channel.port1.onmessageerror = (event) => {
      console.error('[SW] Erro no MessageChannel:', event);
    };

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('[SW] Timeout! Controller:', navigator.serviceWorker.controller?.state);
        reject(new Error('Timeout aguardando resposta do SW'));
      }
    }, 5000);

    try {
      console.log('[SW] Enviando mensagem:', type, payload);
      navigator.serviceWorker.controller.postMessage(
        { type, payload },
        [channel.port2]
      );
      console.log('[SW] Mensagem enviada com sucesso');
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

// API pública
export async function setTokenInSW(token: string, user?: object): Promise<void> {
  await sendMessageToSW('SET_TOKEN', { token, user });
  console.log('[SW] Token enviado para o SW');
}

export async function getTokenFromSW(): Promise<{ token: string | null; user: object | null }> {
  const result = await sendMessageToSW<{ token: string | null; user: object | null }>('GET_TOKEN');
  return result;
}

export async function clearTokenInSW(): Promise<void> {
  await sendMessageToSW('CLEAR_TOKEN');
  console.log('[SW] Token removido do SW');
}

export async function debugSWStatus(): Promise<{
  hasToken: boolean;
  tokenPreview: string | null;
  timestamp: string;
}> {
  const result = await sendMessageToSW<{
    hasToken: boolean;
    tokenPreview: string | null;
    timestamp: string;
  }>('DEBUG_STATUS');
  
  console.log('[SW] Debug status:', result);
  return result;
}

// Verifica se o SW está pronto
export function isSWReady(): boolean {
  return !!navigator.serviceWorker?.controller;
}
