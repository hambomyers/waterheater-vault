/**
 * Maintenance Profile API - Smart Checklist Management
 * GET: Retrieve maintenance checklist for a scan
 * PATCH: Update checklist item status and notes
 */

import { generateSmartChecklist } from '../_utils/wh-compute'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS })
}

export const onRequestGet = async ({ request, env, query }: any) => {
  try {
    const imageId = query.get('imageId')
    const zip = query.get('zip')

    if (!imageId) {
      return Response.json({ error: 'imageId required' }, { status: 400, headers: CORS })
    }

    if (!env.DB) {
      return Response.json({ error: 'Database not configured' }, { status: 500, headers: CORS })
    }

    // Get scan result from database
    const scanResult = await env.DB.prepare(`
      SELECT brand, model, fuel_type, tank_size_gallons, maintenance_profile, checklist_items
      FROM scan_results 
      WHERE image_id = ?
    `).bind(imageId).first()

    if (!scanResult) {
      return Response.json({ error: 'Scan not found' }, { status: 404, headers: CORS })
    }

    // Generate checklist if not exists
    let checklistItems = scanResult.checklist_items ? JSON.parse(scanResult.checklist_items) : null
    let maintenanceProfile = scanResult.maintenance_profile ? JSON.parse(scanResult.maintenance_profile) : null

    if (!checklistItems || !maintenanceProfile) {
      // Extract data for checklist generation
      const extraction = {
        brand: scanResult.brand,
        model: scanResult.model,
        fuelType: scanResult.fuel_type,
        tankSizeGallons: scanResult.tank_size_gallons
      }

      // Generate checklist
      checklistItems = generateSmartChecklist(extraction, zip)

      // Calculate maintenance profile
      maintenanceProfile = {
        totalTasks: checklistItems.length,
        completedTasks: checklistItems.filter((item: any) => item.status === 'completed').length,
        pendingTasks: checklistItems.filter((item: any) => item.status === 'pending').length,
        nextAnnualDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastCompleted: null,
        isTankless: extraction.fuelType?.toLowerCase().includes('tankless') || false,
        hardWaterArea: zip && (zip.startsWith('15') || zip.startsWith('16'))
      }

      // Save to database
      await env.DB.prepare(`
        UPDATE scan_results 
        SET maintenance_profile = ?, checklist_items = ?
        WHERE image_id = ?
      `).bind(
        JSON.stringify(maintenanceProfile),
        JSON.stringify(checklistItems),
        imageId
      ).run()
    }

    return Response.json({
      imageId,
      maintenanceProfile,
      checklistItems,
      generatedAt: new Date().toISOString()
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[MAINTENANCE GET] Error:', err)
    return Response.json(
      { error: 'Failed to get maintenance data', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}

export const onRequestPatch = async ({ request, env, query }: any) => {
  try {
    const imageId = query.get('imageId')
    
    if (!imageId) {
      return Response.json({ error: 'imageId required' }, { status: 400, headers: CORS })
    }

    if (!env.DB) {
      return Response.json({ error: 'Database not configured' }, { status: 500, headers: CORS })
    }

    const body = await request.json()
    const { itemId, status, notes } = body

    if (!itemId || !status) {
      return Response.json({ error: 'itemId and status required' }, { status: 400, headers: CORS })
    }

    // Get current checklist
    const currentResult = await env.DB.prepare(`
      SELECT checklist_items, maintenance_profile
      FROM scan_results 
      WHERE image_id = ?
    `).bind(imageId).first()

    if (!currentResult) {
      return Response.json({ error: 'Scan not found' }, { status: 404, headers: CORS })
    }

    const checklistItems = JSON.parse(currentResult.checklist_items || '[]')
    let maintenanceProfile = JSON.parse(currentResult.maintenance_profile || '{}')

    // Update checklist item
    const itemIndex = checklistItems.findIndex((item: any) => item.id === itemId)
    if (itemIndex === -1) {
      return Response.json({ error: 'Checklist item not found' }, { status: 404, headers: CORS })
    }

    checklistItems[itemIndex] = {
      ...checklistItems[itemIndex],
      status: status,
      notes: notes || checklistItems[itemIndex].notes,
      completedAt: status === 'completed' ? new Date().toISOString() : checklistItems[itemIndex].completedAt
    }

    // Recalculate maintenance profile
    maintenanceProfile = {
      ...maintenanceProfile,
      totalTasks: checklistItems.length,
      completedTasks: checklistItems.filter((item: any) => item.status === 'completed').length,
      pendingTasks: checklistItems.filter((item: any) => item.status === 'pending').length,
      lastCompleted: status === 'completed' ? new Date().toISOString() : maintenanceProfile.lastCompleted
    }

    // Save updated data
    await env.DB.prepare(`
      UPDATE scan_results 
      SET maintenance_profile = ?, checklist_items = ?
      WHERE image_id = ?
    `).bind(
      JSON.stringify(maintenanceProfile),
      JSON.stringify(checklistItems),
      imageId
    ).run()

    return Response.json({
      imageId,
      maintenanceProfile,
      checklistItems,
      updatedItem: checklistItems[itemIndex],
      updatedAt: new Date().toISOString()
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[MAINTENANCE PATCH] Error:', err)
    return Response.json(
      { error: 'Failed to update maintenance data', message: err.message },
      { status: 500, headers: CORS }
    )
  }
}
