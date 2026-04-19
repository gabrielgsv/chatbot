let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;
    await waitForSWActive(registration);

    return registration;
  } catch (error) {
    return null;
  }
}

async function waitForSWActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (navigator.serviceWorker.controller) return;

  if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing?.addEventListener('statechange', function() {
        if (this.state === 'activated') resolve();
      });
    });
  }

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve());
    });
  }
}

async function waitForController(timeout = 10000): Promise<void> {
  if (navigator.serviceWorker.controller) return;

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

async function sendMessageToSW<T>(type: string, payload?: unknown): Promise<T> {
  await waitForController();

  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('Service Worker não está controlando a página'));
      return;
    }

    const channel = new MessageChannel();
    let resolved = false;
    
    channel.port1.onmessage = (event) => {
      if (!resolved) {
        resolved = true;
        resolve(event.data as T);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Timeout aguardando resposta do SW'));
      }
    }, 5000);

    try {
      navigator.serviceWorker.controller.postMessage(
        { type, payload },
        [channel.port2]
      );
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

export async function setTokenInSW(token: string, user?: object): Promise<void> {
  await sendMessageToSW('SET_TOKEN', { token, user });
}

export async function getTokenFromSW(): Promise<{ token: string | null; user: object | null }> {
  const result = await sendMessageToSW<{ token: string | null; user: object | null }>('GET_TOKEN');
  return result;
}

export async function clearTokenInSW(): Promise<void> {
  await sendMessageToSW('CLEAR_TOKEN');
}

export async function debugSWStatus(): Promise<{
  hasToken: boolean;
  tokenPreview: string | null;
  timestamp: string;
}> {
  return await sendMessageToSW<{
    hasToken: boolean;
    tokenPreview: string | null;
    timestamp: string;
  }>('DEBUG_STATUS');
}

export function isSWReady(): boolean {
  return !!navigator.serviceWorker?.controller;
}
