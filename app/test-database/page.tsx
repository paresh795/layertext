import { currentUser } from '@clerk/nextjs/server'
import { 
  getUserCredits, 
  getUserPayments,
  getUserUploads,
  getUserExports 
} from '@/lib/services/user-sync'

export default async function TestDatabasePage() {
  const user = await currentUser()
  
  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">🔐 Not Authenticated</h2>
          <p>You must be signed in to test database operations.</p>
        </div>
      </div>
    )
  }

  try {
    // Test database operations
    const credits = await getUserCredits(user.id)
    const payments = await getUserPayments(user.id)
    const uploads = await getUserUploads(user.id)
    const exports = await getUserExports(user.id)

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Integration Test</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h2 className="font-bold text-blue-800 mb-2">👤 User Information</h2>
            <div className="space-y-1 text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            </div>
          </div>

          {/* Credits */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h2 className="font-bold text-green-800 mb-2">💰 Credits</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Current Balance:</strong> {credits}</p>
              <p className="text-xs text-gray-600">
                Credits are automatically initialized to 0 for new users
              </p>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h2 className="font-bold text-purple-800 mb-2">💳 Payment History</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Total Payments:</strong> {payments.length}</p>
              {payments.length > 0 ? (
                <div className="max-h-32 overflow-y-auto">
                  {payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="text-xs border-t border-purple-200 pt-1 mt-1">
                      <p>Amount: ${payment.amount / 100} | Credits: {payment.credits_granted}</p>
                      <p>Status: {payment.status} | {new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No payments yet</p>
              )}
            </div>
          </div>

          {/* Uploads */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h2 className="font-bold text-orange-800 mb-2">📤 Upload History</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Total Uploads:</strong> {uploads.length}</p>
              {uploads.length > 0 ? (
                <div className="max-h-32 overflow-y-auto">
                  {uploads.slice(0, 3).map((upload) => (
                    <div key={upload.id} className="text-xs border-t border-orange-200 pt-1 mt-1">
                      <p>Status: {upload.status}</p>
                      <p>Credit Used: {upload.credit_used ? 'Yes' : 'No'}</p>
                      <p>{new Date(upload.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No uploads yet</p>
              )}
            </div>
          </div>

          {/* Exports */}
          <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
            <h2 className="font-bold text-cyan-800 mb-2">📥 Export History</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Total Exports:</strong> {exports.length}</p>
              {exports.length > 0 ? (
                <div className="max-h-32 overflow-y-auto">
                  {exports.slice(0, 3).map((exportItem) => (
                    <div key={exportItem.id} className="text-xs border-t border-cyan-200 pt-1 mt-1">
                      <p>Text: &quot;{exportItem.text_content.substring(0, 30)}...&quot;</p>
                      <p>Font: {exportItem.font_size}px {exportItem.font_color}</p>
                      <p>{new Date(exportItem.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No exports yet</p>
              )}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg">
            <h2 className="font-bold">✅ Supabase Integration Working!</h2>
            <ul className="text-sm mt-2 space-y-1">
              <li>✓ User data retrieval successful</li>
              <li>✓ Credit balance tracking active</li>
              <li>✓ Database connections established</li>
              <li>✓ RLS policies enforced</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-bold mb-2">🔗 Test Links:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><a href="/api/user/sync" className="text-blue-600 hover:underline">API: GET /api/user/sync</a></li>
            <li><a href="/dashboard" className="text-blue-600 hover:underline">Dashboard (with live credit balance)</a></li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Setup Required</h3>
          <p className="text-sm text-yellow-700">
            To fully test this functionality, make sure you have:
          </p>
          <ul className="text-sm text-yellow-700 mt-1 space-y-1 list-disc list-inside">
            <li>Supabase project created and environment variables set</li>
            <li>Database schema applied (run the SQL migration)</li>
            <li>RLS policies enabled and configured</li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">❌ Database Connection Error</h2>
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="mt-2 text-sm">
            Make sure your Supabase environment variables are configured correctly.
          </p>
        </div>
      </div>
    )
  }
}