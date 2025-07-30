import { fal } from '@fal-ai/client'

// Configure FAL client
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
}

export interface FalBackgroundRemovalResult {
  imageUrl: string
  success: boolean
  error?: string
}

/**
 * Remove background from image using FAL API
 */
export async function removeBackground(imageUrl: string): Promise<FalBackgroundRemovalResult> {
  try {
    if (!process.env.FAL_KEY) {
      throw new Error('FAL_KEY environment variable not configured')
    }

    console.log('🔄 Starting background removal with FAL API...')
    
    const result = await fal.subscribe('fal-ai/bria/background/remove', {
      input: { 
        image_url: imageUrl 
      },
      logs: false,
    })

    if (!result.data?.image?.url) {
      throw new Error('Invalid response from FAL API - no image URL returned')
    }

    console.log('✅ Background removal completed successfully')
    
    return {
      imageUrl: result.data.image.url,
      success: true
    }
  } catch (error) {
    console.error('❌ FAL API error:', error)
    
    return {
      imageUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check if FAL API is properly configured
 */
export function isFalConfigured(): boolean {
  return !!process.env.FAL_KEY
}

/**
 * Validate image URL before sending to FAL API
 */
export function validateImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const validProtocols = ['http:', 'https:']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    if (!validProtocols.includes(parsedUrl.protocol)) {
      return false
    }
    
    const pathname = parsedUrl.pathname.toLowerCase()
    const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext))
    
    return hasValidExtension
  } catch {
    return false
  }
}