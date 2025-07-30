'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  RotateCcw, 
  Type, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  Move3D,
  Palette
} from 'lucide-react'

// Enhanced TextLayer interface with comprehensive styling
interface TextLayer {
  id: string
  text: string
  x: number // percentage
  y: number // percentage
  fontSize: number
  color: string
  fontFamily: string
  fontWeight: number
  textAlign: 'left' | 'center' | 'right'
  shadowBlur: number
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  opacity: number
  letterSpacing: number
  lineHeight: number
  visible: boolean
  rotation: number
}

interface EnhancedTextOverlayEditorProps {
  backgroundImageUrl: string
  foregroundImageUrl: string
  onExport?: (canvasData: string, textLayers: TextLayer[]) => void
  disabled?: boolean
}

// Web-safe fonts + popular Google Fonts
const FONT_OPTIONS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
]

const DEFAULT_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#90ee90', '#add8e6'
]

// Helper function to create unique layer ID
const generateLayerId = () => `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// SafeImage component for external URLs
const SafeImage = ({ 
  src, 
  alt, 
  className, 
  ...props 
}: { 
  src: string
  alt: string
  className?: string
  [key: string]: any
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      {...props}
    />
  )
}

export function EnhancedTextOverlayEditor({ 
  backgroundImageUrl, 
  foregroundImageUrl, 
  onExport,
  disabled = false 
}: EnhancedTextOverlayEditorProps) {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    {
      id: generateLayerId(),
      text: 'YOUR TEXT',
      x: 50,
      y: 50,
      fontSize: 80,
      color: '#ffffff',
      fontFamily: 'Impact, sans-serif',
      fontWeight: 900,
      textAlign: 'center',
      shadowBlur: 6,
      shadowColor: '#000000',
      shadowOffsetX: 0,
      shadowOffsetY: 6,
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.2,
      visible: true,
      rotation: 0
    }
  ])
  
  const [selectedLayerId, setSelectedLayerId] = useState<string>(textLayers[0]?.id || '')
  const [isDragging, setIsDragging] = useState(false)
  const [isAddingText, setIsAddingText] = useState(false)
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const backgroundImgRef = useRef<HTMLImageElement>(null)
  const foregroundImgRef = useRef<HTMLImageElement>(null)

  const selectedLayer = textLayers.find(layer => layer.id === selectedLayerId)

  // Update container dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Add new text layer
  const addTextLayer = useCallback((x: number = 50, y: number = 30) => {
    const newLayer: TextLayer = {
      id: generateLayerId(),
      text: 'New Text',
      x,
      y,
      fontSize: 60,
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 700,
      textAlign: 'center',
      shadowBlur: 4,
      shadowColor: '#000000',
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.2,
      visible: true,
      rotation: 0
    }
    
    setTextLayers(prev => [...prev, newLayer])
    setSelectedLayerId(newLayer.id)
  }, [])

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    setTextLayers(prev => prev.filter(layer => layer.id !== layerId))
    
    // Select another layer if current is deleted
    if (selectedLayerId === layerId) {
      const remainingLayers = textLayers.filter(layer => layer.id !== layerId)
      setSelectedLayerId(remainingLayers[0]?.id || '')
    }
  }, [selectedLayerId, textLayers])

  // Duplicate layer
  const duplicateLayer = useCallback((layerId: string) => {
    const layer = textLayers.find(l => l.id === layerId)
    if (layer) {
      const newLayer = {
        ...layer,
        id: generateLayerId(),
        x: layer.x + 5,
        y: layer.y + 5,
        text: layer.text + ' Copy'
      }
      setTextLayers(prev => [...prev, newLayer])
      setSelectedLayerId(newLayer.id)
    }
  }, [textLayers])

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ))
  }, [])

  // Update layer property
  const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ))
  }, [])

  // Handle canvas click to add text
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isAddingText || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    addTextLayer(x, y)
    setIsAddingText(false)
  }, [isAddingText, addTextLayer])

  // Handle text drag - REVERTED TO ORIGINAL WORKING VERSION
  const handleMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    if (disabled || isAddingText) return
    
    setSelectedLayerId(layerId)
    setIsDragging(true)
  }, [disabled, isAddingText])

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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any)
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

  // Export to canvas with performance optimization
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

    // Draw visible text layers with UNIFIED SCALING SYSTEM
    textLayers
      .filter(layer => layer.visible)
      .forEach(layer => {
        const scaleFactor = canvas.width / 800 // Same scaling as editor
        
        ctx.font = `${layer.fontWeight} ${layer.fontSize * scaleFactor}px ${layer.fontFamily}`
        ctx.fillStyle = layer.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = layer.opacity
        
        // Add shadow with same scaling as editor
        ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = layer.shadowBlur * scaleFactor
        ctx.shadowOffsetX = layer.shadowOffsetX * scaleFactor
        ctx.shadowOffsetY = layer.shadowOffsetY * scaleFactor

        const x = (layer.x / 100) * canvas.width
        const y = (layer.y / 100) * canvas.height
        
        ctx.fillText(layer.text, x, y)
        
        // Reset shadow and alpha
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.globalAlpha = 1
      })

    // Draw foreground
    ctx.drawImage(foregroundImg, 0, 0)

    // Get canvas data and trigger download
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    
    // Trigger download immediately
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `layertext-export-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    if (onExport) {
      onExport(dataUrl, textLayers.filter(layer => layer.visible))
    }

    return dataUrl
  }, [textLayers, onExport])

  // Reset selected layer position
  const resetPosition = useCallback(() => {
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { x: 50, y: 50 })
    }
  }, [selectedLayer, updateLayer])

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto p-6">
      {/* Canvas for export (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden images for canvas rendering */}
      <img
        ref={backgroundImgRef}
        src={backgroundImageUrl}
        alt="Background"
        className="hidden"
        crossOrigin="anonymous"
      />
      <img
        ref={foregroundImgRef}
        src={foregroundImageUrl}
        alt="Foreground"
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* Left Panel - Layer Management */}
      <div className="w-full xl:w-80 space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text Layers
            </h3>
            <Button
              size="sm"
              onClick={() => setIsAddingText(true)}
              className={`${isAddingText ? 'bg-blue-600' : ''}`}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isAddingText ? 'Click on image' : 'Add Text'}
            </Button>
          </div>

          {/* Layer List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {textLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedLayerId === layer.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {layer.text || 'Empty Text'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Layer {index + 1} • {layer.fontSize}px
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility(layer.id)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateLayer(layer.id)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(layer.id)
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      disabled={textLayers.length === 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center - Image Preview */}
      <div className="flex-1">
        <div 
          ref={containerRef}
          className={`relative rounded-lg overflow-hidden shadow-2xl bg-gray-100 ${
            isAddingText ? 'cursor-crosshair' : ''
          }`}
          style={{ aspectRatio: '4/3' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* Background Layer */}
          <SafeImage
            src={backgroundImageUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Text Layers */}
          {textLayers
            .filter(layer => layer.visible)
            .map((layer) => (
            <div
              key={layer.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none font-black transition-all duration-100 ${
                layer.id === selectedLayerId ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                fontSize: `${layer.fontSize * (containerDimensions.width / 800)}px`,
                color: layer.color,
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight,
                textAlign: layer.textAlign,
                textShadow: `${layer.shadowOffsetX * (containerDimensions.width / 800)}px ${layer.shadowOffsetY * (containerDimensions.width / 800)}px ${layer.shadowBlur * (containerDimensions.width / 800)}px ${layer.shadowColor}`,
                opacity: layer.opacity,
                letterSpacing: `${layer.letterSpacing * (containerDimensions.width / 800)}px`,
                lineHeight: layer.lineHeight,
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

          {/* Add Text Overlay */}
          {isAddingText && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium">Click to add text</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Text Controls */}
      <div className="w-full xl:w-96 space-y-4">
        {selectedLayer && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5" />
              <h3 className="font-semibold">Text Properties</h3>
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Text</label>
              <Input
                value={selectedLayer.text}
                onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="Enter your text"
                disabled={disabled}
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium mb-2">Font</label>
              <Select
                value={selectedLayer.fontFamily}
                onValueChange={(value) => updateLayer(selectedLayer.id, { fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Font Size</label>
                <span className="text-sm text-gray-500">{selectedLayer.fontSize}px</span>
              </div>
              <Slider
                value={[selectedLayer.fontSize]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { fontSize: value })}
                min={12}
                max={200}
                step={1}
                disabled={disabled}
              />
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-sm font-medium mb-2">Font Weight</label>
              <Select
                value={selectedLayer.fontWeight.toString()}
                onValueChange={(value) => updateLayer(selectedLayer.id, { fontWeight: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                  <SelectItem value="900">Black (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium mb-2">Text Alignment</label>
              <Select
                value={selectedLayer.textAlign}
                onValueChange={(value: 'left' | 'center' | 'right') => 
                  updateLayer(selectedLayer.id, { textAlign: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedLayer.color === color 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateLayer(selectedLayer.id, { color })}
                    disabled={disabled}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={selectedLayer.color}
                onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                className="w-full h-10"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Opacity</label>
                <span className="text-sm text-gray-500">{Math.round(selectedLayer.opacity * 100)}%</span>
              </div>
              <Slider
                value={[selectedLayer.opacity]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { opacity: value })}
                min={0}
                max={1}
                step={0.01}
                disabled={disabled}
              />
            </div>

            {/* Shadow */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Shadow</label>
                <span className="text-sm text-gray-500">{selectedLayer.shadowBlur}px</span>
              </div>
              <Slider
                value={[selectedLayer.shadowBlur]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { shadowBlur: value })}
                min={0}
                max={25}
                step={1}
                disabled={disabled}
              />
            </div>

            {/* Letter Spacing */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Letter Spacing</label>
                <span className="text-sm text-gray-500">{selectedLayer.letterSpacing}px</span>
              </div>
              <Slider
                value={[selectedLayer.letterSpacing]}
                onValueChange={([value]) => updateLayer(selectedLayer.id, { letterSpacing: value })}
                min={-5}
                max={10}
                step={0.1}
                disabled={disabled}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPosition}
                disabled={disabled}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={exportToCanvas}
                disabled={disabled}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click "Add Text" then click on image to place</li>
            <li>• Drag text to move around</li>
            <li>• Use layer panel to manage multiple texts</li>
            <li>• Customize each text independently</li>
            <li>• Click "Export" to download final image</li>
          </ul>
        </div>
      </div>
    </div>
  )
}