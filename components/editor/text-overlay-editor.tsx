'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, RotateCcw, Type } from 'lucide-react'

// Helper function to check if URL is from a trusted domain
const isTrustedImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const trustedDomains = [
      'osienefimadxwwldwjtw.supabase.co',
      'fal.media',
      'v3.fal.media',
      'v2.fal.media',
      'v1.fal.media'
    ]
    return trustedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

// Custom Image component that handles external URLs gracefully
const SafeImage = ({ 
  src, 
  alt, 
  className, 
  ...props 
}: { 
  src: string
  alt: string
  className?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) => {
  if (isTrustedImageUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        crossOrigin="anonymous"
        {...props}
      />
    )
  }
  
  // Fallback for any other URLs
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      {...props}
    />
  )
}

interface TextLayer {
  id: string
  text: string
  x: number // percentage
  y: number // percentage
  fontSize: number
  color: string
  shadowBlur: number
}

interface TextOverlayEditorProps {
  backgroundImageUrl: string
  foregroundImageUrl: string
  onExport?: (canvasData: string, textLayers: TextLayer[]) => void
  disabled?: boolean
}

const DEFAULT_COLORS = [
  '#ffffff', // white
  '#ffdd59', // yellow
  '#ff4757', // red
  '#48dbfb', // blue
  '#1dd1a1', // green
  '#000000', // black
]

export function TextOverlayEditor({ 
  backgroundImageUrl, 
  foregroundImageUrl, 
  onExport,
  disabled = false 
}: TextOverlayEditorProps) {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    {
      id: '1',
      text: 'YOUR TEXT',
      x: 50,
      y: 50,
      fontSize: 80,
      color: '#ffffff',
      shadowBlur: 6
    }
  ])
  
  const [selectedLayerId, setSelectedLayerId] = useState<string>('1')
  const [isDragging, setIsDragging] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const backgroundImgRef = useRef<HTMLImageElement>(null)
  const foregroundImgRef = useRef<HTMLImageElement>(null)

  const selectedLayer = textLayers.find(layer => layer.id === selectedLayerId)

  // Update text layer property
  const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ))
  }, [])

  // Handle text drag start
  const handleMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    if (disabled) return
    
    setSelectedLayerId(layerId)
    setIsDragging(true)
    
    // Start dragging - position tracking happens in mousemove
  }, [disabled])

  // Handle text dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Clamp values
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    updateLayer(selectedLayerId, { x: clampedX, y: clampedY })
  }, [isDragging, selectedLayerId, updateLayer])

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Create a React-like event object with the properties we need
        const reactEvent = {
          clientX: e.clientX,
          clientY: e.clientY,
        } as React.MouseEvent
        handleMouseMove(reactEvent)
      }
      
      const handleGlobalMouseUp = () => {
        handleMouseUp()
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Export to canvas
  const exportToCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    const backgroundImg = backgroundImgRef.current
    const foregroundImg = foregroundImgRef.current
    
    if (!canvas || !backgroundImg || !foregroundImg) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match background image
    canvas.width = backgroundImg.naturalWidth
    canvas.height = backgroundImg.naturalHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.drawImage(backgroundImg, 0, 0)

    // Draw text layers
    textLayers.forEach(layer => {
      ctx.font = `900 ${layer.fontSize * (canvas.width / 800)}px Impact, Arial Black, sans-serif`
      ctx.fillStyle = layer.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Add shadow
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = layer.shadowBlur * (canvas.width / 800)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = layer.shadowBlur * (canvas.width / 800)

      const x = (layer.x / 100) * canvas.width
      const y = (layer.y / 100) * canvas.height
      
      ctx.fillText(layer.text, x, y)
      
      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })

    // Draw foreground
    ctx.drawImage(foregroundImg, 0, 0)

    // Get canvas data
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    
    if (onExport) {
      onExport(dataUrl, textLayers)
    }

    return dataUrl
  }, [textLayers, onExport])

  // Reset text position
  const resetPosition = useCallback(() => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { x: 50, y: 50 })
    }
  }, [selectedLayer, updateLayer])

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6">
      {/* Canvas for export (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden images for canvas rendering */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={backgroundImgRef}
        src={backgroundImageUrl}
        alt="Background"
        className="hidden"
        crossOrigin="anonymous"
        onError={() => console.error('Failed to load background image:', backgroundImageUrl)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={foregroundImgRef}
        src={foregroundImageUrl}
        alt="Foreground"
        className="hidden"
        crossOrigin="anonymous"
        onError={() => console.error('Failed to load foreground image:', foregroundImageUrl)}
      />

      {/* Image Preview */}
      <div className="flex-1">
        <div 
          ref={containerRef}
          className="relative rounded-lg overflow-hidden shadow-2xl bg-gray-100"
          style={{ aspectRatio: '4/3' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Background Layer */}
          <SafeImage
            src={backgroundImageUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Text Layers */}
          {textLayers.map((layer) => (
            <div
              key={layer.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none font-black transition-all duration-100 ${
                layer.id === selectedLayerId ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                fontSize: `${layer.fontSize * 0.1}vw`,
                color: layer.color,
                textShadow: `0px ${layer.shadowBlur}px ${layer.shadowBlur * 2}px rgba(0,0,0,0.7)`,
                fontFamily: 'Impact, Arial Black, sans-serif',
                whiteSpace: 'nowrap',
                zIndex: 2,
              }}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
            >
              {layer.text}
            </div>
          ))}

          {/* Foreground Layer */}
          <SafeImage
            src={foregroundImageUrl}
            alt="Foreground"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 3 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-5 w-5" />
            <h3 className="font-semibold">Text Editor</h3>
          </div>

          {/* Text Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Text</label>
              <Input
                value={selectedLayer?.text || ''}
                onChange={(e) => selectedLayer && updateLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="Enter your text"
                disabled={disabled}
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Font Size</label>
                <span className="text-sm text-gray-500">{selectedLayer?.fontSize}px</span>
              </div>
              <Slider
                value={[selectedLayer?.fontSize || 80]}
                onValueChange={([value]) => selectedLayer && updateLayer(selectedLayer.id, { fontSize: value })}
                min={10}
                max={300}
                step={1}
                disabled={disabled}
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedLayer?.color === color 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => selectedLayer && updateLayer(selectedLayer.id, { color })}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>

            {/* Shadow */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Shadow</label>
                <span className="text-sm text-gray-500">{selectedLayer?.shadowBlur}px</span>
              </div>
              <Slider
                value={[selectedLayer?.shadowBlur || 6]}
                onValueChange={([value]) => selectedLayer && updateLayer(selectedLayer.id, { shadowBlur: value })}
                min={0}
                max={25}
                step={1}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={resetPosition}
              disabled={disabled}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Position
            </Button>
            <Button
              onClick={exportToCanvas}
              disabled={disabled}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click and drag text to reposition</li>
            <li>• Use controls to customize appearance</li>
            <li>• Click &quot;Export PNG&quot; to download</li>
          </ul>
        </div>
      </div>
    </div>
  )
}