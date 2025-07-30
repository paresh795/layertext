import { Suspense } from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ExportHistoryGrid } from '@/components/history/export-history-grid'
import { ExportStats } from '@/components/history/export-stats'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function HistoryPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <h1 className="text-xl font-semibold text-gray-900">Export History</h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-8">
          <Suspense fallback={<div className="h-32 bg-white rounded-lg animate-pulse" />}>
            <ExportStats userId={user.id} />
          </Suspense>
        </div>

        {/* Export History Grid */}
        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <ExportHistoryGrid userId={user.id} />
        </Suspense>
      </main>
    </div>
  )
}