'use client'

import { useState, useEffect } from 'react'
import type { RichProfile } from '../lib/profile/profile-builder'

interface ChecklistItem {
  id: string
  task: string
  frequency: string
  status: 'pending' | 'completed' | 'skipped'
  notes: string
  completedAt?: string
}

interface MaintenanceProfile {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  nextAnnualDue: string
  lastCompleted?: string
  isTankless: boolean
  hardWaterArea: boolean
}

interface MaintenanceChecklistSectionProps {
  profile: RichProfile
}

export default function MaintenanceChecklistSection({ profile }: MaintenanceChecklistSectionProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [maintenanceProfile, setMaintenanceProfile] = useState<MaintenanceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadMaintenanceData()
  }, [profile])

  const loadMaintenanceData = async () => {
    try {
      // Get imageId from sessionStorage (stored during scan)
      const scanResult = sessionStorage.getItem('scanResult')
      if (!scanResult) return

      const { imageId } = JSON.parse(scanResult)
      
      const response = await fetch(`/api/consumer/maintenance?imageId=${imageId}`)
      if (response.ok) {
        const data = await response.json()
        setChecklistItems(data.checklistItems || [])
        setMaintenanceProfile(data.maintenanceProfile)
      }
    } catch (error) {
      console.error('Failed to load maintenance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateChecklistItem = async (itemId: string, status: 'pending' | 'completed' | 'skipped', notes?: string) => {
    try {
      const scanResult = sessionStorage.getItem('scanResult')
      if (!scanResult) return

      const { imageId } = JSON.parse(scanResult)
      
      const response = await fetch(`/api/consumer/maintenance?imageId=${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status, notes })
      })

      if (response.ok) {
        const data = await response.json()
        setChecklistItems(data.checklistItems || [])
        setMaintenanceProfile(data.maintenanceProfile)
      }
    } catch (error) {
      console.error('Failed to update checklist item:', error)
    }
  }

  const downloadICal = () => {
    if (!maintenanceProfile) return

    const events = checklistItems
      .filter(item => item.status === 'pending')
      .map(item => {
        const dueDate = new Date(maintenanceProfile.nextAnnualDue)
        return [
          'BEGIN:VEVENT',
          `DTSTART:${dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
          `SUMMARY:${item.task}`,
          `DESCRIPTION:Water Heater Maintenance - ${item.frequency}`,
          'END:VEVENT'
        ].join('\n')
      })

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Water Heater Vault//Maintenance Calendar//EN',
      ...events,
      'END:VCALENDAR'
    ].join('\n')

    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'water-heater-maintenance.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#0066ff]" />
        </div>
      </section>
    )
  }

  if (!maintenanceProfile || checklistItems.length === 0) {
    return null
  }

  const completionPercentage = Math.round((maintenanceProfile.completedTasks / maintenanceProfile.totalTasks) * 100)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-white/60">
          Maintenance Checklist
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/60 hover:text-white transition-colors"
        >
          {expanded ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Overview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/80">
            {maintenanceProfile.completedTasks} of {maintenanceProfile.totalTasks} completed
          </span>
          <span className="text-sm text-[#0066ff]">{completionPercentage}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#0066ff] to-[#00aaff] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-light text-white">{maintenanceProfile.totalTasks}</div>
          <div className="text-xs text-white/60">Total Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-light text-[#0066ff]">{maintenanceProfile.nextAnnualDue}</div>
          <div className="text-xs text-white/60">Next Due</div>
        </div>
      </div>

      {/* Expanded Checklist */}
      {expanded && (
        <div className="space-y-2 mt-4 border-t border-white/10 pt-4">
          {checklistItems.map((item) => (
            <ChecklistItemRow 
              key={item.id} 
              item={item} 
              onUpdate={updateChecklistItem}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <button
          onClick={downloadICal}
          className="flex-1 rounded-full border border-white/20 py-2 text-center text-sm font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          Download iCal
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 rounded-full bg-[#0066ff] py-2 text-center text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
        >
          {expanded ? 'Hide' : 'Show'} Tasks
        </button>
      </div>
    </section>
  )
}

function ChecklistItemRow({ 
  item, 
  onUpdate 
}: { 
  item: ChecklistItem
  onUpdate: (id: string, status: 'pending' | 'completed' | 'skipped', notes?: string) => void 
}) {
  const [notes, setNotes] = useState(item.notes || '')
  const [showNotes, setShowNotes] = useState(false)

  const handleStatusChange = (status: 'pending' | 'completed' | 'skipped') => {
    onUpdate(item.id, status, notes)
  }

  const handleNotesSave = () => {
    onUpdate(item.id, item.status, notes)
    setShowNotes(false)
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleStatusChange(
            item.status === 'completed' ? 'pending' : 'completed'
          )}
          className={`mt-1 h-4 w-4 rounded-full border-2 transition-colors ${
            item.status === 'completed' 
              ? 'bg-[#0066ff] border-[#0066ff]' 
              : 'border-white/30 hover:border-white/50'
          }`}
        >
          {item.status === 'completed' && (
            <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-light ${
                item.status === 'completed' ? 'text-white/40 line-through' : 'text-white/80'
              }`}>
                {item.task}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/60">{item.frequency}</span>
                {item.completedAt && (
                  <span className="text-xs text-green-400">
                    Completed {new Date(item.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {showNotes && (
            <div className="mt-2 space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder-white/40 focus:border-[#0066ff] focus:outline-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNotesSave}
                  className="rounded-full bg-[#0066ff] px-3 py-1 text-xs font-medium text-white transition-transform hover:scale-105"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-light text-white/60 transition-colors hover:border-white/40 hover:text-white/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
