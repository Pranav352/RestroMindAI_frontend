import ordersApi from '../api/orders';
import { getQueuedOfflineOrders, removeQueuedOfflineOrder } from './db';

let isSyncing = false;

/**
 * Drain queued offline orders from IndexedDB outbox to the Django backend
 */
export const drainOfflineOrderQueue = async () => {
  if (isSyncing || !navigator.onLine) return;

  try {
    isSyncing = true;
    const queuedOrders = await getQueuedOfflineOrders();

    if (!queuedOrders || queuedOrders.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[Sync Engine] Found ${queuedOrders.length} queued offline order(s). Syncing...`);

    for (const item of queuedOrders) {
      try {
        const { tempId, queued_at, sync_status, ...orderPayload } = item;
        
        // Post order payload to Django REST backend
        const createdOrder = await ordersApi.createOrder(orderPayload);
        console.log(`[Sync Engine] Successfully synced offline order #${createdOrder.id}`);

        // Store access token for order tracking if provided
        if (createdOrder.access_token && orderPayload.restaurant) {
          localStorage.setItem(`active_order_token_${orderPayload.restaurant}`, createdOrder.access_token);
        }

        // Remove from outbox store
        await removeQueuedOfflineOrder(tempId);

        // Dispatch custom global event so UI components can update dynamically
        window.dispatchEvent(
          new CustomEvent('offline-order-synced', {
            detail: { tempId, order: createdOrder }
          })
        );
      } catch (err) {
        console.error(`[Sync Engine Error] Failed to sync order tempId ${item.tempId}:`, err);
      }
    }
  } catch (err) {
    console.error('[Sync Engine Error] Outbox drain error:', err);
  } finally {
    isSyncing = false;
  }
};

/**
 * Register global background sync listeners
 */
export const initSyncEngine = () => {
  // Listen for browser coming back online
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network status: ONLINE — Triggering outbox sync');
    drainOfflineOrderQueue();
  });

  // Attempt sync on initial app load if online
  if (navigator.onLine) {
    drainOfflineOrderQueue();
  }
};
