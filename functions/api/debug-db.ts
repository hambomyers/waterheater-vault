/**
 * Debug Database Connection
 * Test endpoint to verify D1 is working
 */

export const onRequestGet = async ({ env }: any) => {
  try {
    if (!env.DB) {
      return Response.json({ error: 'No DB binding' }, { status: 500 })
    }

    // Test basic query
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM scan_images').first()
    
    return Response.json({
      success: true,
      dbConnected: true,
      scanImagesCount: result?.count || 0,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
