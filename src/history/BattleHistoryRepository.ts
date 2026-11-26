import { BattleRecord, BattleOutcome } from './BattleRecord';

const DB_NAME = 'PettySorcererDB';
const STORE_NAME = 'battle_records';
const DB_VERSION = 1;
const MAX_RECORDS = 500;

/**
 * Persistent IndexedDB-backed repository for BattleRecord objects.
 * Falls back to in-memory storage in test/non-browser environments.
 */
export class BattleHistoryRepository {
  private inMemoryStore: BattleRecord[] = [];
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (this.isIndexedDBAvailable()) {
      this.dbPromise = this.openDB();
    }
  }

  // ─── Public API ───────────────────────────────────────────────────

  public async saveRecord(record: BattleRecord): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    // In-memory fallback
    const existing = this.inMemoryStore.findIndex((r) => r.id === record.id);
    if (existing >= 0) {
      this.inMemoryStore[existing] = record;
    } else {
      this.inMemoryStore.push(record);
      if (this.inMemoryStore.length > MAX_RECORDS) {
        this.inMemoryStore.shift();
      }
    }
  }

  public async getAllRecords(): Promise<BattleRecord[]> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result as BattleRecord[]);
        req.onerror = () => reject(req.error);
      });
    }
    return [...this.inMemoryStore];
  }

  public async getRecordById(id: string): Promise<BattleRecord | undefined> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result as BattleRecord | undefined);
        req.onerror = () => reject(req.error);
      });
    }
    return this.inMemoryStore.find((r) => r.id === id);
  }

  public async deleteRecord(id: string): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    this.inMemoryStore = this.inMemoryStore.filter((r) => r.id !== id);
  }

  public async clearHistory(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    this.inMemoryStore = [];
  }

  public async getRecordsByOutcome(outcome: BattleOutcome): Promise<BattleRecord[]> {
    const all = await this.getAllRecords();
    return all.filter((r) => r.outcome === outcome);
  }

  public async getRecordsByOpponent(opponentId: string): Promise<BattleRecord[]> {
    const all = await this.getAllRecords();
    return all.filter((r) => r.opponentId === opponentId);
  }

  public async getRecordCount(): Promise<number> {
    const all = await this.getAllRecords();
    return all.length;
  }

  public async exportHistoryJson(): Promise<string> {
    const all = await this.getAllRecords();
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
      records: all,
    }, null, 2);
  }

  public async importHistoryJson(json: string): Promise<number> {
    const data = JSON.parse(json);
    if (!data.records || !Array.isArray(data.records)) {
      throw new Error('Invalid battle history export format');
    }

    let imported = 0;
    for (const record of data.records as BattleRecord[]) {
      if (record.id && record.schemaVersion && record.outcome) {
        await this.saveRecord(record);
        imported += 1;
      }
    }
    return imported;
  }

  // ─── Private ──────────────────────────────────────────────────────

  private isIndexedDBAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.indexedDB;
    } catch {
      return false;
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('outcome', 'outcome', { unique: false });
          store.createIndex('opponentId', 'opponentId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global singleton (lazy-initialized)
let _repository: BattleHistoryRepository | null = null;

export function getBattleHistoryRepository(): BattleHistoryRepository {
  if (!_repository) {
    _repository = new BattleHistoryRepository();
  }
  return _repository;
}
