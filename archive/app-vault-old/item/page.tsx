'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { privateVault, VaultItem, VaultDocs, VaultDocItem, normalizeDocs } from '../../../vault/private'
import InvitePlumberButton from '../../components/InvitePlumberButton'
import PDFReportGenerator from '../../components/PDFReportGenerator'

// ── Field definitions ──────────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'textarea'
  editable: boolean
  path: 'extractedData' | 'root'
  alwaysShow?: boolean  // show even when empty — signals "app looked, didn't find"
}

const FIELDS: FieldDef[] = [
  { key: 'brand',                    label: 'Brand',               type: 'text',     editable: true,  path: 'extractedData' },
  { key: 'model',                    label: 'Model',               type: 'text',     editable: true,  path: 'extractedData' },
  { key: 'serialNumber',             label: 'Serial Number',       type: 'text',     editable: true,  path: 'extractedData', alwaysShow: true },
  { key: 'manufactureDate',          label: 'Manufacture Date',    type: 'text',     editable: true,  path: 'extractedData', alwaysShow: true },
  { key: 'fuelType',                 label: 'Fuel Type',           type: 'text',     editable: true,  path: 'extractedData' },
  { key: 'tankSizeGallons',          label: 'Tank Size (gal)',     type: 'text',     editable: true,  path: 'extractedData' },
  { key: 'currentWarranty',          label: 'Warranty',            type: 'text',     editable: true,  path: 'extractedData', alwaysShow: true },
  { key: 'estimatedReplacementCost', label: 'Replacement Cost',    type: 'text',     editable: false, path: 'extractedData' },
  { key: 'notes',                    label: 'Notes',               type: 'textarea', editable: true,  path: 'root' },
]

function getValue(item: VaultItem, field: FieldDef): string {
  if (field.path === 'extractedData') {
    const v = (item.extractedData as any)[field.key]
    if (field.key === 'estimatedReplacementCost' && v != null) return `$${Number(v).toLocaleString()} installed`
    return v ?? ''
  }
  return (item as any)[field.key] ?? ''
}

// ── Remaining Life Gauge ─────────────────────────────────────────────────────

function RemainingLifeGauge({ remainingLifeYears, ageYears }: { remainingLifeYears: number; ageYears: number }) {
  const totalLife = ageYears + remainingLifeYears
  const pct = totalLife > 0 ? Math.max(0, Math.min(100, (remainingLifeYears / totalLife) * 100)) : 0
  const color = remainingLifeYears < 2 ? '#ef4444' : remainingLifeYears < 5 ? '#f59e0b' : '#22c55e'
  const label = remainingLifeYears < 2 ? 'Critical — plan replacement now' : remainingLifeYears < 5 ? 'Aging — schedule inspection' : 'Healthy'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white text-opacity-60 text-sm font-light">Estimated remaining life</span>
        <span className="font-medium text-sm" style={{ color }}>{remainingLifeYears} yr · {label}</span>
      </div>
      <div className="h-2 rounded-full bg-white bg-opacity-10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-white text-opacity-25 text-xs font-light">
        <span>Age: {ageYears} yr</span>
        <span>Remaining: ~{remainingLifeYears} yr</span>
      </div>
    </div>
  )
}

// ── Price Surprise Calculator ─────────────────────────────────────────────────

function PriceSurpriseCalculator({ replacementCost, remainingYears }: { replacementCost: number; remainingYears: number }) {
  const emergencyPremium = Math.round(replacementCost * 0.3)
  const monthlySavings = replacementCost > 0 ? Math.round(replacementCost / Math.max(remainingYears * 12, 1)) : 0
  const urgency = remainingYears < 2 ? 'high' : remainingYears < 5 ? 'medium' : 'low'
  return (
    <div className="space-y-3">
      <div className="text-white text-opacity-40 text-xs font-light uppercase tracking-widest mb-1">Price Surprise Calculator</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white bg-opacity-5 rounded-xl p-4">
          <div className="text-white text-opacity-40 text-xs font-light mb-1">Estimated replacement</div>
          <div className="text-blue-accent font-semibold text-xl">${replacementCost.toLocaleString()}</div>
          <div className="text-white text-opacity-30 text-xs font-light">installed cost</div>
        </div>
        <div className="bg-white bg-opacity-5 rounded-xl p-4">
          <div className="text-white text-opacity-40 text-xs font-light mb-1">Emergency premium</div>
          <div className="text-amber-400 font-semibold text-xl">+${emergencyPremium.toLocaleString()}</div>
          <div className="text-white text-opacity-30 text-xs font-light">if it fails overnight</div>
        </div>
      </div>
      {urgency !== 'low' && monthlySavings > 0 && (
        <div className="bg-white bg-opacity-5 rounded-xl p-4 flex items-center justify-between">
          <span className="text-white text-opacity-60 text-sm font-light">Start saving now</span>
          <span className="text-white font-medium">${monthlySavings}/mo</span>
        </div>
      )}
    </div>
  )
}

// ── Main component (needs Suspense for useSearchParams) ────────────────────

function VaultItemContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  const [item, setItem] = useState<VaultItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [docsEdits, setDocsEdits] = useState<DocEdits>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    privateVault.getItem(id)
      .then((v) => { setItem(v); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const enterEdit = () => {
    if (!item) return
    const initial: Record<string, string> = {}
    FIELDS.filter((f) => f.editable).forEach((f) => {
      initial[f.key] = getValue(item, f)
    })
    setEdits(initial)
    // Seed docsEdits with the current URL for each doc type
    const initialDocs: DocEdits = {}
    normalizeDocs(item.docs).forEach((doc) => {
      initialDocs[doc.type] = doc.url ?? null
    })
    setDocsEdits(initialDocs)
    setEditMode(true)
    setSaveMsg(null)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEdits({})
    setDocsEdits({})
  }

  const handleSave = async () => {
    if (!item) return
    setSaving(true)
    try {
      const updatedExtractedData = { ...item.extractedData }
      const updatedRoot: Partial<VaultItem> = {}

      FIELDS.filter((f) => f.editable).forEach((f) => {
        const val = edits[f.key] ?? ''
        if (f.path === 'extractedData') {
          ;(updatedExtractedData as any)[f.key] = val || undefined
        } else if (f.path === 'root') {
          ;(updatedRoot as any)[f.key] = val || undefined
        }
      })

      // Merge URL edits back into the docs array
      const updatedDocs: VaultDocs = normalizeDocs(item.docs).map((doc) => ({
        ...doc,
        url: docsEdits[doc.type] !== undefined ? (docsEdits[doc.type] ?? null) : doc.url,
      }))

      await privateVault.updateItem(item.id, {
        extractedData: updatedExtractedData,
        docs: updatedDocs,
        ...updatedRoot,
      })

      // Reload fresh from IndexedDB
      const refreshed = await privateVault.getItem(item.id)
      setItem(refreshed)
      setEditMode(false)
      setEdits({})
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch {
      setSaveMsg('Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    await privateVault.deleteItem(item.id)
    router.push('/vault')
  }

  // ── Loading / not found ──
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-opacity-40 font-light animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-white text-opacity-50 font-light">Item not found.</div>
        <Link href="/vault" className="text-blue-accent text-sm font-light hover:underline">
          ← Back to vault
        </Link>
      </div>
    )
  }

  const recalls = item.activeRecalls ?? []

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">

      {/* ── RECALL BANNER — shown on both mobile and desktop when item is recalled ── */}
      {recalls.length > 0 && (
        <div className="bg-red-500 bg-opacity-10 border-b border-red-500 border-opacity-25 px-6 py-4">
          {recalls.map((recall, i) => (
            <div key={i} className="max-w-5xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 font-medium text-sm">⚠ Active Safety Recall</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-snug">{recall.title}</p>
                  <p className="text-white text-opacity-55 text-xs font-light mt-1">
                    <span className="text-red-400">Hazard:</span> {recall.hazard} &nbsp;·&nbsp;
                    <span className="text-white text-opacity-55">Remedy:</span> {recall.remedy}
                  </p>
                </div>
                <a
                  href={recall.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-full border border-red-500 border-opacity-50 text-red-400 text-xs font-medium hover:bg-red-500 hover:bg-opacity-10 transition-all touch-manipulation"
                >
                  CPSC Remedy ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MOBILE ── */}
      <div className="md:hidden min-h-screen flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 shrink-0">
          <Link href="/vault" className="flex items-center gap-1 text-white text-opacity-50 hover:text-opacity-90 min-h-[44px] touch-manipulation transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span className="text-sm font-light">Vault</span>
          </Link>
          {!editMode ? (
            <button
              onClick={enterEdit}
              className="text-blue-accent font-light text-sm min-h-[44px] px-2 touch-manipulation"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className="text-white text-opacity-50 font-light text-sm min-h-[44px] px-2 touch-manipulation"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Save feedback */}
        {saveMsg && (
          <div className={`mx-6 mb-3 px-4 py-2 rounded-xl text-sm text-center font-light ${
            saveMsg === 'Saved'
              ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30'
              : 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-30'
          }`}>
            {saveMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
          {/* Photo */}
          {item.imageData && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white bg-opacity-5 border border-white border-opacity-10">
              <img src={item.imageData} alt={item.extractedData.product} className="w-full h-full object-contain" />
            </div>
          )}

          {/* Product name headline */}
          <div>
            <h1 className="text-white text-xl font-medium leading-tight">
              {item.extractedData.product}
            </h1>
            <p className="text-white text-opacity-40 text-sm font-light mt-1">
              Added {new Date(item.dateAdded).toLocaleDateString()}
            </p>
          </div>

          {/* Fields */}
          <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden divide-y divide-white divide-opacity-5">
            {FIELDS.map((field) => {
              const val = editMode && field.editable ? edits[field.key] ?? '' : getValue(item, field)
              const isEmpty = !val && !editMode
              if (isEmpty && !field.alwaysShow) return null

              return (
                <div key={field.key} className="px-5 py-4">
                  <div className="text-white text-opacity-40 text-xs font-light uppercase tracking-wider mb-1">
                    {field.label}
                  </div>
                  {editMode && field.editable ? (
                    field.type === 'textarea' ? (
                      <textarea
                        value={val}
                        onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
                        rows={3}
                        className="w-full bg-transparent text-white text-sm font-light focus:outline-none resize-none border-b border-white border-opacity-20 pb-1"
                        placeholder={`Add ${field.label.toLowerCase()}…`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={val}
                        onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
                        className="w-full bg-transparent text-white text-sm font-light focus:outline-none border-b border-white border-opacity-20 pb-1"
                        placeholder={`Enter ${field.label.toLowerCase()}…`}
                      />
                    )
                  ) : (
                    <div className={`text-sm font-light ${field.key === 'currentValue' ? 'text-blue-accent font-medium' : 'text-white'}`}>
                      {val || (
                        field.alwaysShow
                          ? <span className="text-white text-opacity-20 italic">— tap Edit to add</span>
                          : <span className="text-white text-opacity-20 italic">—</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Remaining Life Gauge */}
          <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5">
            <RemainingLifeGauge
              remainingLifeYears={item.extractedData.remainingLifeYears}
              ageYears={item.extractedData.ageYears}
            />
          </div>

          {/* Price Surprise Calculator */}
          {item.extractedData.estimatedReplacementCost > 0 && (
            <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-5">
              <PriceSurpriseCalculator
                replacementCost={item.extractedData.estimatedReplacementCost}
                remainingYears={item.extractedData.remainingLifeYears}
              />
            </div>
          )}

          {/* Viral CTA + PDF */}
          <div className="space-y-3">
            <InvitePlumberButton extractedData={item.extractedData} />
            <PDFReportGenerator
              extractedData={item.extractedData}
              imageBase64={item.imageData ?? undefined}
            />
          </div>

          {/* Docs & Links */}
          <MobileDocsSection
            item={item}
            editMode={editMode}
            docsEdits={docsEdits}
            setDocsEdits={setDocsEdits}
          />

          {/* Save button */}
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full min-h-[52px] py-4 bg-blue-accent text-white rounded-full font-medium text-lg disabled:opacity-50 active:scale-[0.98] touch-manipulation"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}

          {/* Delete */}
          {!editMode && (
            <div className="pt-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-3 text-red-400 text-opacity-60 text-sm font-light hover:text-opacity-100 touch-manipulation"
                >
                  Delete from vault
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-300 rounded-full text-sm font-medium border border-red-500 border-opacity-30 touch-manipulation"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-3 border border-white border-opacity-20 text-white text-opacity-60 rounded-full text-sm font-light touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-12">

          {/* Back */}
          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 text-white text-opacity-40 hover:text-opacity-75 text-sm font-light transition-colors duration-200 mb-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Vault
          </Link>

          {/* Title row with inline actions */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-white text-4xl font-light">{item.extractedData.product}</h1>
              <p className="text-white text-opacity-40 font-light mt-1">
                {item.extractedData.brand}
                {item.extractedData.model && item.extractedData.model !== 'Unknown' && ` · ${item.extractedData.model}`}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 shrink-0">
              {!editMode ? (
                <>
                  <button
                    onClick={enterEdit}
                    className="px-5 py-2 rounded-full border border-blue-accent text-white text-sm font-medium hover:bg-blue-accent hover:bg-opacity-10 transition-all duration-200"
                  >
                    Edit
                  </button>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="px-5 py-2 rounded-full border border-white border-opacity-10 text-white text-opacity-35 text-sm font-light hover:border-red-500 hover:border-opacity-40 hover:text-red-400 transition-all duration-200"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        className="px-5 py-2 rounded-full bg-red-500 bg-opacity-15 text-red-400 text-sm font-medium border border-red-500 border-opacity-30 hover:bg-opacity-25 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-25 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 rounded-full bg-blue-accent text-white text-sm font-medium hover:bg-opacity-90 transition-colors duration-200 disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-5 py-2 rounded-full border border-white border-opacity-10 text-white text-opacity-40 text-sm font-light hover:border-opacity-25 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date meta + save feedback */}
          <div className="flex items-center gap-4 mb-10">
            <p className="text-white text-opacity-25 text-sm font-light">
              Added {new Date(item.dateAdded).toLocaleDateString()}
              {item.lastUpdated !== item.dateAdded && (
                <> · Edited {new Date(item.lastUpdated).toLocaleDateString()}</>
              )}
            </p>
            {saveMsg && (
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-light ${
                saveMsg === 'Saved'
                  ? 'bg-green-500 bg-opacity-15 text-green-300'
                  : 'bg-red-500 bg-opacity-15 text-red-300'
              }`}>
                {saveMsg}
              </span>
            )}
          </div>

          {/* Photo + fields */}
          <div className="flex gap-8 mb-6 items-start">
            {item.imageData && (
              <div className="w-72 shrink-0">
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white bg-opacity-4 border border-white border-opacity-8">
                  <img src={item.imageData} alt={item.extractedData.product} className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5">
                {FIELDS.map((field) => {
                  const val = editMode && field.editable ? edits[field.key] ?? '' : getValue(item, field)
                  const isEmpty = !val && !editMode
                  if (isEmpty && !field.alwaysShow) return null
                  return (
                    <div key={field.key} className="grid grid-cols-3 gap-4 px-6 py-4 items-start">
                      <div className="text-white text-opacity-35 text-sm font-light">{field.label}</div>
                      <div className="col-span-2">
                        {editMode && field.editable ? (
                          field.type === 'textarea' ? (
                            <textarea
                              value={val}
                              onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
                              rows={3}
                              className="w-full bg-transparent text-white text-sm font-light focus:outline-none resize-none border-b border-white border-opacity-20 pb-1"
                              placeholder={`Add ${field.label.toLowerCase()}…`}
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={val}
                              onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
                              className="w-full bg-transparent text-white text-sm font-light focus:outline-none border-b border-white border-opacity-20 pb-1"
                              placeholder={`Enter ${field.label.toLowerCase()}…`}
                            />
                          )
                        ) : (
                          <div className={`text-sm font-light ${field.key === 'currentValue' ? 'text-blue-accent font-medium' : 'text-white'}`}>
                            {val || (
                              field.alwaysShow
                                ? <span className="text-white text-opacity-20 italic">— tap Edit to add</span>
                                : <span className="text-white text-opacity-20 italic">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Remaining Life Gauge — desktop */}
          <div className="rounded-2xl border border-white border-opacity-8 p-6 mb-5">
            <RemainingLifeGauge
              remainingLifeYears={item.extractedData.remainingLifeYears}
              ageYears={item.extractedData.ageYears}
            />
          </div>

          {/* Price Surprise Calculator — desktop */}
          {item.extractedData.estimatedReplacementCost > 0 && (
            <div className="rounded-2xl border border-white border-opacity-8 p-6 mb-5">
              <PriceSurpriseCalculator
                replacementCost={item.extractedData.estimatedReplacementCost}
                remainingYears={item.extractedData.remainingLifeYears}
              />
            </div>
          )}

          {/* Viral CTA + PDF — desktop */}
          <div className="flex gap-4 mb-6">
            <InvitePlumberButton extractedData={item.extractedData} />
            <PDFReportGenerator
              extractedData={item.extractedData}
              imageBase64={item.imageData ?? undefined}
            />
          </div>

          {/* Docs — full width below */}
          <DesktopDocsSection
            item={item}
            editMode={editMode}
            docsEdits={docsEdits}
            setDocsEdits={setDocsEdits}
          />
        </div>
      </div>
    </div>
  )
}

// ── Docs section helpers ────────────────────────────────────────────────────

type DocEdits = Record<string, string | null>

interface DocsSectionProps {
  item: VaultItem
  editMode: boolean
  docsEdits: DocEdits
  setDocsEdits: (d: DocEdits) => void
}

function googleFallback(item: VaultItem, doc: VaultDocItem) {
  const q = encodeURIComponent(
    doc.searchQuery || `${item.extractedData.brand} ${item.extractedData.model} ${doc.label}`
  )
  return `https://www.google.com/search?q=${q}`
}

function MobileDocsSection({ item, editMode, docsEdits, setDocsEdits }: DocsSectionProps) {
  const docs = normalizeDocs(item.docs)
  if (docs.length === 0 && !editMode) return null

  return (
    <div className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 overflow-hidden divide-y divide-white divide-opacity-5">
      <div className="px-5 py-3 text-white text-opacity-40 text-xs font-light uppercase tracking-wider">
        Docs &amp; Links
      </div>
      {docs.map((doc, i) => {
        const url = editMode ? (docsEdits[doc.type] ?? doc.url) : doc.url
        return (
          <div key={doc.type + i} className="px-5 py-4">
            <div className="text-white text-opacity-40 text-xs font-light uppercase tracking-wider mb-1">
              {doc.label}
            </div>
            {editMode ? (
              <input
                type="url"
                value={url ?? ''}
                onChange={(e) => setDocsEdits({ ...docsEdits, [doc.type]: e.target.value || null })}
                placeholder="https://…"
                className="w-full bg-transparent text-white text-sm font-light focus:outline-none border-b border-white border-opacity-20 pb-1"
              />
            ) : url ? (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-blue-accent text-sm font-light underline underline-offset-2 break-all">
                Open {doc.label} ↗
              </a>
            ) : (
              <a href={googleFallback(item, doc)} target="_blank" rel="noopener noreferrer"
                className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60 transition-all">
                Search Google ↗
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DesktopDocsSection({ item, editMode, docsEdits, setDocsEdits }: DocsSectionProps) {
  const docs = normalizeDocs(item.docs)
  if (docs.length === 0 && !editMode) return null

  return (
    <div className="rounded-2xl border border-white border-opacity-8 overflow-hidden divide-y divide-white divide-opacity-5">
      <div className="px-6 py-3 text-white text-opacity-30 text-xs font-light uppercase tracking-widest">
        Docs &amp; Links
      </div>
      {docs.map((doc, i) => {
        const url = editMode ? (docsEdits[doc.type] ?? doc.url) : doc.url
        return (
          <div key={doc.type + i} className="flex items-center justify-between px-6 py-4">
            <div className="text-white text-opacity-50 text-sm font-light">{doc.label}</div>
            <div className="ml-4 min-w-0">
              {editMode ? (
                <input
                  type="url"
                  value={url ?? ''}
                  onChange={(e) => setDocsEdits({ ...docsEdits, [doc.type]: e.target.value || null })}
                  placeholder="https://…"
                  className="w-72 bg-transparent text-white text-sm font-light focus:outline-none border-b border-white border-opacity-20 pb-1 text-right"
                />
              ) : url ? (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-accent text-sm font-light hover:underline">
                  Open ↗
                </a>
              ) : (
                <a href={googleFallback(item, doc)} target="_blank" rel="noopener noreferrer"
                  className="text-white text-opacity-30 text-sm font-light hover:text-opacity-60 transition-all">
                  Search ↗
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Suspense wrapper required for useSearchParams in Next.js 14
export default function VaultItemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-opacity-40 font-light animate-pulse">Loading…</div>
      </div>
    }>
      <VaultItemContent />
    </Suspense>
  )
}
