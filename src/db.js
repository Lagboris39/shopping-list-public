import { openDB } from 'idb';

const DB_NAME = 'shoppingListDB';
const DB_VERSION = 1;

export async function initDB() {
    return await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('learnedCategories')) {
                db.createObjectStore('learnedCategories');
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        },
    });
}

export async function getItems() {
    const db = await initDB();
    return await db.getAll('items');
}

let itemsWriteQueue = Promise.resolve();

export function saveItems(items) {
    itemsWriteQueue = itemsWriteQueue.then(async () => {
        const db = await initDB();
        const tx = db.transaction('items', 'readwrite');
        await tx.objectStore('items').clear();
        for (const item of items) {
            await tx.objectStore('items').put(item);
        }
        await tx.done;
    }).catch(() => {
        // エラーはここで握りつぶし、呼び出し元を止めない
    });
    return itemsWriteQueue;
}

export async function getHistory() {
    const db = await initDB();
    return await db.getAll('history');
}

export async function saveHistory(historyItems) {
    const db = await initDB();
    const tx = db.transaction('history', 'readwrite');
    await tx.objectStore('history').clear();
    for (const item of historyItems) {
        await tx.objectStore('history').put(item);
    }
    await tx.done;
}

export async function getLearnedCategories() {
    const db = await initDB();
    const keys = await db.getAllKeys('learnedCategories');
    const values = await db.getAll('learnedCategories');
    const result = {};
    for (let i = 0; i < keys.length; i++) {
        result[keys[i]] = values[i];
    }
    return result;
}

export async function saveLearnedCategory(word, category) {
    const db = await initDB();
    await db.put('learnedCategories', category, word);
}

export async function getSetting(key) {
    const db = await initDB();
    return await db.get('settings', key);
}

export async function saveSetting(key, value) {
    const db = await initDB();
    await db.put('settings', value, key);
}
