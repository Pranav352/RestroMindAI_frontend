import { useState, useEffect } from 'react';
import api from '../api/api';

/**
 * Utility helper to convert VAPID base64 string to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const subscribeToPush = async (restaurantId = null) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications are not supported in this browser.');
      return false;
    }

    try {
      setPushLoading(true);
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Fetch VAPID public key from Django DRF API
        const response = await api.get('/api/auth/push/vapid-public-key/');
        const publicKey = response.data.publicKey;

        if (!publicKey) {
          throw new Error('VAPID public key not configured on backend.');
        }

        const convertedKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      // Send subscription object to Django backend endpoint
      await api.post('/api/auth/push/subscribe/', {
        subscription: subscription.toJSON(),
        restaurant_id: restaurantId
      });

      setPushSubscribed(true);
      console.log('[PWA] Successfully registered Web Push Notification subscription!');
      return true;
    } catch (err) {
      console.error('[PWA Push Error] Failed to subscribe to Web Push:', err);
      return false;
    } finally {
      setPushLoading(false);
    }
  };

  return {
    isInstallable,
    installPWA,
    isOnline,
    pushSubscribed,
    pushLoading,
    subscribeToPush
  };
};
