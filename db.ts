
import { Client, Appointment, Sale, SavedRoute, User } from './types';

const DB_NAME = 'SalesMasterDB_v4';
const DB_VERSION = 1;

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Tabelas independentes
        const stores = ['clients', 'appointments', 'sales', 'routes', 'users'];
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            const os = db.createObjectStore(store, { keyPath: 'id' });
            if (store !== 'users') {
              os.createIndex('userId', 'userId', { unique: false });
            }
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject('Erro ao abrir banco de dados local');
    });
  }

  async getAllForUser<T>(storeName: string, userId: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(`Erro ao buscar dados em ${storeName}`);
    });
  }

  async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Erro ao salvar dados em ${storeName}`);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Erro ao deletar dados em ${storeName}`);
    });
  }
}

export const dbService = new LocalDatabase();
