'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>
  maxSize?: number // in bytes
  disabled?: boolean
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  uploadedFile: File | null
  previewUrl: string | null
}

export function ImageUpload({ 
  onUpload, 
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false 
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
    previewUrl: null,
  })

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload only JPG or PNG images'
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }, [maxSize])

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    setState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
      error: null,
      uploadedFile: file,
      previewUrl,
    }))

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 100)

      await onUpload(file)

      clearInterval(progressInterval)
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
    }
  }, [onUpload, validateFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
    disabled: disabled || state.uploading,
  })

  const resetUpload = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({
      uploading: false,
      progress: 0,
      error: null,
      uploadedFile: null,
      previewUrl: null,
    })
  }, [state.previewUrl])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!state.uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : state.error 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${disabled || state.uploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${
              state.error ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {state.error ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Upload className={`h-8 w-8 ${
                  isDragActive ? 'text-blue-500' : 'text-gray-400'
                }`} />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isDragActive ? 'Drop your image here' : 'Upload an image'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isDragActive 
                  ? 'Release to upload' 
                  : 'Drag and drop or click to browse'
                }
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPG or PNG • Max {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          </div>

          {state.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            {state.previewUrl && (
              <Image
                src={state.previewUrl}
                alt="Uploaded image preview"
                width={800}
                height={600}
                className="w-full h-auto max-h-96 object-contain bg-gray-50"
              />
            )}
            
            <button
              onClick={resetUpload}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              disabled={state.uploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Progress */}
          {state.uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-600">{state.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success State */}
          {state.progress === 100 && !state.uploading && (
            <div className="flex items-center space-x-2 p-3 bg-green-100 border border-green-300 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">
                Image uploaded successfully!
              </span>
            </div>
          )}

          {/* Error State */}
          {state.error && (
            <div className="flex items-center space-x-2 p-3 bg-red-100 border border-red-300 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">{state.error}</span>
            </div>
          )}

          {/* File Info */}
          <div className="text-sm text-gray-500">
            <p><strong>File:</strong> {state.uploadedFile.name}</p>
            <p><strong>Size:</strong> {(state.uploadedFile.size / (1024 * 1024)).toFixed(2)}MB</p>
            <p><strong>Type:</strong> {state.uploadedFile.type}</p>
          </div>
        </div>
      )}
    </div>
  )
}