'use client'

import React, { useState } from 'react'
import { ImageUpload } from '@/components/upload/image-upload'
import { ArrowLeft, History, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Upload {
  id: string
  image_url: string
  status: string
  created_at: string
  credit_used: boolean
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }

    // Refresh uploads list
    fetchUploads()
  }

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/upload')
      const result = await response.json()
      
      if (result.success) {
        setUploads(result.uploads)
      }
    } catch (error) {
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch uploads on component mount
  React.useEffect(() => {
    fetchUploads()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Upload Image</h1>
            <div></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Your Image
            </h2>
            <p className="text-gray-600 mb-6">
              Upload a JPG or PNG image to start adding text layers with AI background removal.
            </p>
            
            <ImageUpload onUpload={handleUpload} />
          </div>

          {/* Recent Uploads */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Uploads
              </h2>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading uploads...</p>
              </div>
            ) : uploads.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="border rounded-lg p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={upload.image_url}
                      alt="Uploaded image"
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${
                          upload.status === 'complete' ? 'text-green-600' : 
                          upload.status === 'pending' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {upload.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Credit Used:</span>
                        <span className="font-medium">
                          {upload.credit_used ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="font-medium">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/editor/${upload.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit with Text
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No uploads yet. Upload your first image above!</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              What&apos;s Next?
            </h3>
            <p className="text-blue-700 mb-4">
              After uploading your image, you&apos;ll be able to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Process images with AI background removal (Story 1.2)</li>
              <li>Add and customize text layers (Stories 2.1-2.4)</li>
              <li>Export your final image with text overlay (Story 1.3)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}