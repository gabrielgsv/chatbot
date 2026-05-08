export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    await waitForSWActive(registration);

    return registration;
  } catch {
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

export function isSWReady(): boolean {
  return !!navigator.serviceWorker?.controller;
}
