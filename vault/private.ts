// Private user vault - IndexedDB + per-user KV storage

export interface PriceBreakdown {
  unitLow: number
  unitHigh: number
  laborLow: number
  laborHigh: number
  emergencyPremiumLow: number
  emergencyPremiumHigh: number
  nationalChainLow: number
  nationalChainHigh: number
}

export interface ExtractedData {
  product: string
  brand: string
  model: string
  serialNumber: string
  manufactureDate: string
  tankSizeGallons?: number
  fuelType: 'gas' | 'electric' | 'tankless' | 'unknown'
  ageYears: number
  remainingLifeYears: number
  estimatedReplacementCost: number
  currentWarranty: string
  priceBreakdown?: PriceBreakdown
}

export interface ValuationData {
  currentValue: number
  originalPrice: number
  depreciationRate: number
  marketTrend: 'up' | 'down' | 'stable'
  confidence: number
  lastUpdated: string
}

export interface VaultDocItem {
  type: string         // e.g. "ownerManual", "warrantyTerms", "installationManual"
  label: string        // Human-readable, e.g. "Owner Manual"
  url: string | null   // Verified URL from Brave Search, or null
  searchQuery?: string // The query that was used to find it (kept for fallback)
}

export type VaultDocs = VaultDocItem[]

/** Normalizes old object-format docs (pre-Phase 7) to the new array format */
export function normalizeDocs(docs: any): VaultDocItem[] {
  if (!docs) return []
  if (Array.isArray(docs)) return docs as VaultDocItem[]
  // Legacy object format — convert once for display
  const items: VaultDocItem[] = []
  if (docs.manualUrl)   items.push({ type: 'ownerManual',   label: 'Owner Manual',   url: docs.manualUrl })
  if (docs.warrantyUrl) items.push({ type: 'warrantyTerms', label: 'Warranty Terms', url: docs.warrantyUrl })
  if (docs.supportUrl)  items.push({ type: 'supportPage',   label: 'Support Page',   url: docs.supportUrl })
  return items
}

export interface ActiveRecall {
  recallNumber: string
  title: string
  url: string
  hazard: string
  remedy: string
  date: string
}

/**
 * Unified event model — any category can push any event type.
 * warrantyExpiry, serviceDue: computed from extractedData fields
 * recall, nhtsa, fdaRecall: pushed by the category-aware recall router
 * drinkingWindow, priceAlert: future category-specific events
 * source: which system generated it — "CPSC" | "NHTSA" | "FDA" | "calculated" | "user"
 */
export interface VaultEvent {
  id: string
  type:
    | 'warrantyExpiry'
    | 'recall'
    | 'serviceDue'
    | 'drinkingWindow'
    | 'priceAlert'
    | 'nhtsa'
    | 'fdaRecall'
    | string // open for future category types
  label: string
  severity: 'info' | 'warning' | 'alert'
  date?: string
  url?: string
  source: string
}

export interface VaultItem {
  id: string
  extractedData: ExtractedData
  valuation?: ValuationData
  docs?: VaultDocs
  imageData?: string
  dateAdded: string
  lastUpdated: string
  tags: string[]
  notes?: string
  // Recall tracking (kept for backward compat — recall checker writes here)
  recallStatus?: 'safe' | 'recalled' | 'unchecked'
  lastRecallCheck?: string
  activeRecalls?: ActiveRecall[]
  // ── New: unified event stream ───────────────────────────────────────────────
  // Optional so all existing items continue working with zero migration.
  // Any code reading events should default to [].
  events?: VaultEvent[]
}

type SyncOperationType = 'upsert' | 'delete'

interface SyncOperation {
  queueId?: number
  type: SyncOperationType
  itemId: string
  payload?: VaultItem
  createdAt: string
}

class PrivateVault {
  private dbName = 'waterheater-vault'
  private dbVersion = 2
  private db?: IDBDatabase
  private syncListenerBound = false

  private cloudSyncAllowed(): boolean {
    if (typeof window === 'undefined') return false
    if (!navigator.onLine) return false
    try {
      return localStorage.getItem('wf_sync_mode') !== 'local-only'
    } catch {
      return false
    }
  }

  private bindOnlineListener() {
    if (typeof window === 'undefined' || this.syncListenerBound) return
    this.syncListenerBound = true
    window.addEventListener('online', () => {
      this.flushSyncQueue()
    })
  }

  private async putLocalItem(vaultItem: VaultItem): Promise<void> {
    if (!this.db) await this.initialize()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['items'], 'readwrite')
      const store = tx.objectStore('items')
      const req = store.put(vaultItem)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  private async enqueueSyncOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) await this.initialize()
    if (typeof window === 'undefined') return
    if (localStorage.getItem('wf_sync_mode') === 'local-only') return
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = tx.objectStore('syncQueue')
      const req = store.add(operation)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  private async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.db) await this.initialize()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['syncQueue'], 'readonly')
      const store = tx.objectStore('syncQueue')
      const req = store.getAll()
      req.onsuccess = () => resolve((req.result as SyncOperation[]) ?? [])
      req.onerror = () => reject(req.error)
    })
  }

  private async removeSyncOperation(queueId: number): Promise<void> {
    if (!this.db) await this.initialize()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = tx.objectStore('syncQueue')
      const req = store.delete(queueId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.bindOnlineListener()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('items')) {
          const itemsStore = db.createObjectStore('items', { keyPath: 'id' })
          itemsStore.createIndex('dateAdded', 'dateAdded', { unique: false })
          itemsStore.createIndex('brand', 'extractedData.brand', { unique: false })
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'queueId', autoIncrement: true })
          queueStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async addItem(item: Omit<VaultItem, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<string> {
    if (!this.db) await this.initialize()

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const vaultItem: VaultItem = {
      ...item,
      id,
      dateAdded: now,
      lastUpdated: now,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite')
      const store = transaction.objectStore('items')
      const request = store.add(vaultItem)

      request.onsuccess = async () => {
        try {
          await this.enqueueSyncOperation({
            type: 'upsert',
            itemId: id,
            payload: vaultItem,
            createdAt: now,
          })
          await this.flushSyncQueue()
        } catch {
          // Local write succeeded; cloud sync can happen later.
        }
        resolve(id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getItem(id: string): Promise<VaultItem | null> {
    if (!this.db) await this.initialize()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly')
      const store = transaction.objectStore('items')
      const request = store.get(id)
      request.onsuccess = () => resolve((request.result as VaultItem) ?? null)
      request.onerror = () => reject(request.error)
    })
  }

  async getItems(limit = 50, offset = 0): Promise<VaultItem[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly')
      const store = transaction.objectStore('items')
      const index = store.index('dateAdded')
      const request = index.openCursor(null, 'prev')

      const items: VaultItem[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && count < limit) {
          if (count >= offset) {
            items.push(cursor.value)
          }
          count++
          cursor.continue()
        } else {
          resolve(items)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async updateItem(id: string, updates: Partial<VaultItem>): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite')
      const store = transaction.objectStore('items')

      store.get(id).onsuccess = (event) => {
        const existing = (event.target as IDBRequest).result
        if (!existing) {
          reject(new Error('Item not found'))
          return
        }

        const updated = {
          ...existing,
          ...updates,
          lastUpdated: new Date().toISOString(),
        }

        const updateRequest = store.put(updated)
        updateRequest.onsuccess = async () => {
          try {
            await this.enqueueSyncOperation({
              type: 'upsert',
              itemId: id,
              payload: updated,
              createdAt: new Date().toISOString(),
            })
            await this.flushSyncQueue()
          } catch {
            // Local write succeeded; cloud sync can happen later.
          }
          resolve()
        }
        updateRequest.onerror = () => reject(updateRequest.error)
      }
    })
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite')
      const store = transaction.objectStore('items')
      const request = store.delete(id)

      request.onsuccess = async () => {
        try {
          await this.enqueueSyncOperation({
            type: 'delete',
            itemId: id,
            createdAt: new Date().toISOString(),
          })
          await this.flushSyncQueue()
        } catch {
          // Local delete succeeded; cloud sync can happen later.
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async flushSyncQueue(): Promise<void> {
    if (!this.db) await this.initialize()
    if (!this.cloudSyncAllowed()) return

    const queue = await this.getSyncQueue()
    for (const operation of queue) {
      if (!operation.queueId) continue
      try {
        let response: Response
        if (operation.type === 'upsert') {
          if (!operation.payload) {
            await this.removeSyncOperation(operation.queueId)
            continue
          }
          response = await fetch('/api/vault/sync', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item: operation.payload }),
          })
        } else {
          response = await fetch(`/api/vault/item/${encodeURIComponent(operation.itemId)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        }

        if (response.status === 401) return
        if (!response.ok) return
        await this.removeSyncOperation(operation.queueId)
      } catch {
        return
      }
    }
  }

  async mergeFromCloud(): Promise<void> {
    if (!this.db) await this.initialize()
    if (!this.cloudSyncAllowed()) return

    try {
      const res = await fetch('/api/vault/sync', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const remoteItems: VaultItem[] = Array.isArray(data?.items) ? data.items : []
      const localItems = await this.getItems(5000, 0)
      const localById = new Map(localItems.map((item) => [item.id, item]))
      const remoteIds = new Set<string>()

      for (const remote of remoteItems) {
        if (!remote?.id) continue
        remoteIds.add(remote.id)
        const local = localById.get(remote.id)
        if (!local) {
          await this.putLocalItem(remote)
        } else {
          // Conflict strategy: local always wins.
          await this.enqueueSyncOperation({
            type: 'upsert',
            itemId: local.id,
            payload: local,
            createdAt: new Date().toISOString(),
          })
        }
      }

      for (const local of localItems) {
        if (remoteIds.has(local.id)) continue
        await this.enqueueSyncOperation({
          type: 'upsert',
          itemId: local.id,
          payload: local,
          createdAt: new Date().toISOString(),
        })
      }

      await this.flushSyncQueue()
    } catch {
      // Keep vault functional even when sync fails.
    }
  }

  async getStats(): Promise<{ totalItems: number, totalValue: number }> {
    const items = await this.getItems(1000)
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.valuation?.currentValue || 0)
    }, 0)

    return {
      totalItems: items.length,
      totalValue,
    }
  }
}

export const privateVault = new PrivateVault()
