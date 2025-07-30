import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserCredits, initializeUserCredits } from '@/lib/services/credits'
import { getUserUploads } from '@/lib/services/upload'
import { CreditBalance } from '@/components/credits/credit-balance'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Initialize user credits if first time
  try {
    await initializeUserCredits(user.id)
  } catch (error) {
    console.error('Failed to initialize user credits:', error)
  }
  
  // Get current credit balance and recent uploads
  const credits = await getUserCredits(user.id)
  const uploads = await getUserUploads(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">LayerText</h1>
            </div>
            <div className="flex items-center space-x-4">
              <CreditBalance showAddButton={true} />
              <span className="text-sm text-gray-700">
                Welcome, {user.firstName || user.primaryEmailAddress?.emailAddress}
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">
              Welcome to LayerText! This is your protected dashboard where you can manage your projects and credits.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <h3 className="font-medium text-gray-900">Credits</h3>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {credits}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Available credits for AI processing
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <h3 className="font-medium text-gray-900">Recent Uploads</h3>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {uploads.length}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Images ready for processing
                </p>
                <div className="mt-2 space-y-1">
                  <Link 
                    href="/upload"
                    className="block text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Upload new image →
                  </Link>
                  <Link 
                    href="/history"
                    className="block text-sm font-medium text-gray-600 hover:text-gray-700"
                  >
                    View export history →
                  </Link>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900">Account</h3>
                <p className="mt-1 text-sm text-gray-600">
                  User ID: {user.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}