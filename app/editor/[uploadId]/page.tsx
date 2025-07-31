'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EnhancedTextOverlayEditor } from '@/components/editor/enhanced-text-overlay-editor'
import { CreditBalance } from '@/components/credits/credit-balance'
import { downloadFile, type TextLayer } from '@/lib/services/export'

interface Upload {
  id: string
  image_url: string
  fal_output_url: string | null
  status: string
  credit_used: boolean
  created_at: string
}

interface ProcessingState {
  status: 'idle' | 'processing' | 'complete' | 'error'
  message?: string
  creditsRemaining?: number
}

export default function EditorPage({ params }: { params: Promise<{ uploadId: string }> }) {
  const resolvedParams = React.use(params)
  const [upload, setUpload] = useState<Upload | null>(null)
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [processingStarted, setProcessingStarted] = useState(false)

  const fetchUpload = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/upload`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch uploads')
      }

      const foundUpload = result.uploads.find((u: Upload) => u.id === resolvedParams.uploadId)
      
      if (!foundUpload) {
        throw new Error('Upload not found')
      }

      setUpload(foundUpload)

      // Auto-processing will be handled by a separate useEffect
    } catch (error) {
      console.error('Error fetching upload:', error)
      setProcessing({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load upload'
      })
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.uploadId])

  const processImage = useCallback(async (uploadId: string) => {
    try {
      // Double-check if already processing to prevent race conditions
      if (processing.status === 'processing') {
        console.log('🔒 Processing already in progress, skipping duplicate call')
        return
      }

      console.log('🚀 Starting background removal process for upload:', uploadId)
      setProcessing({ status: 'processing', message: 'Removing background...' })

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId }),
      })

      const result = await response.json()

      if (!result.success) {
        if (response.status === 402) {
          setProcessing({
            status: 'error',
            message: 'Insufficient credits. Please purchase more credits to continue.'
          })
          return
        }
        if (response.status === 409) {
          console.log('⚠️ Duplicate processing request detected, ignoring')
          setProcessing({
            status: 'processing',
            message: 'Processing already in progress...'
          })
          return
        }
        throw new Error(result.error || 'Processing failed')
      }

      console.log('✅ Background removal completed successfully')
      setUpload(result.upload)
      setProcessing({
        status: 'complete',
        message: 'Background removed successfully!',
        creditsRemaining: result.creditsRemaining
      })

    } catch (error) {
      console.error('Error processing image:', error)
      setProcessing({
        status: 'error',
        message: error instanceof Error ? error.message : 'Processing failed'
      })
    }
  }, [processing.status])

  // Fetch upload data
  useEffect(() => {
    fetchUpload()
  }, [fetchUpload])

  // Auto-start processing if needed
  useEffect(() => {
    if (upload && upload.status === 'pending' && !upload.fal_output_url && !processingStarted) {
      setProcessingStarted(true)
      processImage(upload.id)
    }
  }, [upload, processingStarted, processImage])

  const handleExport = async (canvasDataUrl: string, textLayers: TextLayer[]) => {
    try {
      setExporting(true)

      // Save to database
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canvasDataUrl,
          textLayers,
          uploadId: upload?.id
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }

      // Download the file
      downloadFile(result.export.exportUrl, result.export.fileName)

      // Show success message
      setProcessing({
        status: 'complete',
        message: 'Image exported successfully!'
      })

    } catch (error) {
      console.error('Error exporting image:', error)
      setProcessing({
        status: 'error',
        message: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (!upload) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Not Found</h2>
          <p className="text-gray-600 mb-4">The requested upload could not be found.</p>
          <Link href="/upload">
            <Button>Back to Upload</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/upload"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Uploads</span>
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Text Overlay Editor</h1>
            <div className="flex items-center space-x-2">
              <CreditBalance />
            </div>
          </div>
        </div>
      </header>

      {/* Processing Status */}
      {processing.status !== 'idle' && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            processing.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
            processing.status === 'complete' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {processing.status === 'processing' && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
            {processing.status === 'complete' && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {processing.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${
              processing.status === 'processing' ? 'text-blue-700' :
              processing.status === 'complete' ? 'text-green-700' :
              'text-red-700'
            }`}>
              {processing.message}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {upload.status === 'complete' && upload.fal_output_url ? (
          <EnhancedTextOverlayEditor
            backgroundImageUrl={upload.image_url}
            foregroundImageUrl={upload.fal_output_url}
            onExport={handleExport}
            disabled={exporting}
          />
        ) : (
          <div className="text-center py-12">
            {processing.status === 'processing' ? (
              <div>
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Your Image
                </h3>
                <p className="text-gray-600">
                  We&apos;re removing the background using AI. This may take a few moments...
                </p>
              </div>
            ) : processing.status === 'error' ? (
              <div>
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Failed
                </h3>
                <p className="text-gray-600 mb-4">{processing.message}</p>
                {processing.message?.includes('credits') ? (
                  <Link href="/dashboard">
                    <Button>Buy Credits</Button>
                  </Link>
                ) : (
                  <Button onClick={() => processImage(upload.id)}>
                    Try Again
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-500">📸</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Process
                </h3>
                <p className="text-gray-600 mb-4">
                  Click the button below to start background removal.
                </p>
                <Button onClick={() => processImage(upload.id)}>
                  Start Processing
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}