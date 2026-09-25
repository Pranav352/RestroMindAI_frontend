import { openDB } from 'idb';

const DB_NAME = 'restromind-pwa-db';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB instance for RestroMind AI PWA
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 1. Menu Cache Store (keyed by restaurantId)
      if (!db.objectStoreNames.contains('menu_cache')) {
        db.createObjectStore('menu_cache', { keyPath: 'restaurantId' });
      }

      // 2. Active Orders Cache Store (keyed by order ID)
      if (!db.objectStoreNames.contains('orders_cache')) {
        const ordersStore = db.createObjectStore('orders_cache', { keyPath: 'id' });
        ordersStore.createIndex('status', 'status');
      }

      // 3. Offline Outbox Queue for pending orders
      if (!db.objectStoreNames.contains('offline_orders_queue')) {
        db.createObjectStore('offline_orders_queue', { keyPath: 'tempId', autoIncrement: true });
      }
    }
  });
};

/**
 * Cache Public Menu JSON for a restaurant
 */
export const cachePublicMenu = async (restaurantId, menuData) => {
  try {
    const db = await initDB();
    await db.put('menu_cache', {
      restaurantId: String(restaurantId),
      data: menuData,
      timestamp: Date.now()
    });
    console.log(`[PWA DB] Cached public menu for restaurant ${restaurantId}`);
  } catch (err) {
    console.error('[PWA DB Error] Failed to cache menu:', err);
  }
};

/**
 * Retrieve cached Public Menu JSON for a restaurant
 */
export const getCachedPublicMenu = async (restaurantId) => {
  try {
    const db = await initDB();
    const record = await db.get('menu_cache', String(restaurantId));
    if (record && record.data) {
      console.log(`[PWA DB] Retrieved cached menu for restaurant ${restaurantId} (Cached at: ${new Date(record.timestamp).toLocaleTimeString()})`);
      return record.data;
    }
    return null;
  } catch (err) {
    console.error('[PWA DB Error] Failed to retrieve cached menu:', err);
    return null;
  }
};

/**
 * Cache active orders list
 */
export const cacheActiveOrders = async (ordersList) => {
  try {
    const db = await initDB();
    const tx = db.transaction('orders_cache', 'readwrite');
    const store = tx.objectStore('orders_cache');
    await store.clear();
    for (const order of ordersList) {
      await store.put(order);
    }
    await tx.done;
    console.log(`[PWA DB] Cached ${ordersList.length} active orders`);
  } catch (err) {
    console.error('[PWA DB Error] Failed to cache active orders:', err);
  }
};

/**
 * Get cached active orders
 */
export const getCachedActiveOrders = async () => {
  try {
    const db = await initDB();
    return await db.getAll('orders_cache');
  } catch (err) {
    console.error('[PWA DB Error] Failed to retrieve cached active orders:', err);
    return [];
  }
};

/**
 * Enqueue an order created offline into the outbox queue
 */
export const enqueueOfflineOrder = async (orderPayload) => {
  try {
    const db = await initDB();
    const queuedItem = {
      ...orderPayload,
      queued_at: new Date().toISOString(),
      sync_status: 'pending'
    };
    const tempId = await db.add('offline_orders_queue', queuedItem);
    console.log(`[PWA DB] Enqueued offline order tempId: ${tempId}`);
    return tempId;
  } catch (err) {
    console.error('[PWA DB Error] Failed to enqueue offline order:', err);
    throw err;
  }
};

/**
 * Get all queued offline orders awaiting sync
 */
export const getQueuedOfflineOrders = async () => {
  try {
    const db = await initDB();
    return await db.getAll('offline_orders_queue');
  } catch (err) {
    console.error('[PWA DB Error] Failed to get queued offline orders:', err);
    return [];
  }
};

/**
 * Remove a queued order from outbox once synced
 */
export const removeQueuedOfflineOrder = async (tempId) => {
  try {
    const db = await initDB();
    await db.delete('offline_orders_queue', tempId);
    console.log(`[PWA DB] Removed tempId ${tempId} from offline order queue`);
  } catch (err) {
    console.error('[PWA DB Error] Failed to remove queued order:', err);
  }
};
