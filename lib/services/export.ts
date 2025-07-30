export interface TextLayer {
  id: string
  text: string
  x: number // percentage
  y: number // percentage
  fontSize: number
  color: string
  shadowBlur: number
}

/**
 * Download file from URL as blob
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}