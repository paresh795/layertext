import { currentUser } from '@clerk/nextjs/server'

export default async function TestClerkPage() {
  try {
    const user = await currentUser()
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Clerk Integration Test</h1>
        
        {user ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h2 className="font-bold">✅ Authentication Working!</h2>
            <p>User ID: {user.id}</p>
            <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
            <p>First Name: {user.firstName}</p>
            <p>Last Name: {user.lastName}</p>
          </div>
        ) : (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <h2 className="font-bold">🔐 Not Authenticated</h2>
            <p>User is not signed in. This page would normally be protected by middleware.</p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="font-bold mb-2">Test Links:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="/sign-in" className="text-blue-600 hover:underline">Sign In Page</a></li>
            <li><a href="/sign-up" className="text-blue-600 hover:underline">Sign Up Page</a></li>
            <li><a href="/dashboard" className="text-blue-600 hover:underline">Protected Dashboard</a></li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">❌ Clerk Setup Issue</h2>
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="mt-2 text-sm">Make sure your Clerk environment variables are set correctly.</p>
        </div>
      </div>
    )
  }
}