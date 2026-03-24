/**
 * Image preprocessing utilities for better OCR accuracy
 * Applies contrast enhancement and sharpening to improve text recognition
 */

/**
 * Preprocess image for better OCR results
 * @param imageData - Blob or base64 image data
 * @returns Preprocessed image as base64
 */
export async function preprocessImage(imageData: Blob | string): Promise<string> {
  // Convert to blob if needed
  let blob: Blob
  if (typeof imageData === 'string') {
    // Convert base64 to blob
    const base64Data = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    blob = new Blob([byteArray], { type: 'image/jpeg' })
  } else {
    blob = imageData
  }

  // Create canvas and load image
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  const img = await loadImage(blob)
  canvas.width = img.width
  canvas.height = img.height

  // Draw original image
  ctx.drawImage(img, 0, 0)

  // Get image data
  const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageDataObj.data

  // Apply contrast enhancement
  const contrast = 1.3 // Increase contrast by 30%
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))

  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128       // Red
    data[i + 1] = factor * (data[i + 1] - 128) + 128 // Green
    data[i + 2] = factor * (data[i + 2] - 128) + 128 // Blue
  }

  // Apply sharpening (simple unsharp mask)
  const sharpened = sharpenImage(imageDataObj)
  ctx.putImageData(sharpened, 0, 0)

  // Convert to base64
  return canvas.toDataURL('image/jpeg', 0.95)
}

/**
 * Load image from blob
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Apply sharpening filter
 */
function sharpenImage(imageData: ImageData): ImageData {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const output = new ImageData(width, height)

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            sum += data[idx] * kernel[kernelIdx]
          }
        }
        const outputIdx = (y * width + x) * 4 + c
        output.data[outputIdx] = Math.max(0, Math.min(255, sum))
      }
      // Copy alpha channel
      const alphaIdx = (y * width + x) * 4 + 3
      output.data[alphaIdx] = data[alphaIdx]
    }
  }

  return output
}
