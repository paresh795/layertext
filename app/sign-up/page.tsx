import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Join LayerText
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start layering text in images with AI
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp 
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-black hover:bg-gray-800 text-sm normal-case",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}