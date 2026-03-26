/**
 * Image preprocessing – optimized for BOTH Tesseract AND vision models
 * Light touch = better results on shiny metal labels
 */
export async function preprocessImage(imageData: Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Max 1024px longest side (perfect balance for Grok Vision)
      const MAX = 1024
      if (width > MAX || height > MAX) {
        const ratio = MAX / Math.max(width, height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      ctx.drawImage(img, 0, 0, width, height)

      // Gentle auto-enhance for shiny labels (no heavy contrast)
      ctx.filter = 'contrast(1.08) brightness(1.03)'

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject

    if (typeof imageData === 'string') {
      img.src = imageData.includes('base64') ? imageData : `data:image/jpeg;base64,${imageData}` 
    } else {
      img.src = URL.createObjectURL(imageData)
    }
  })
}
