import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">Sign up to get started</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl rounded-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: 
                "bg-[#F03D3D] hover:bg-[#d93636] text-white rounded-lg py-3 font-medium transition-colors",
              formFieldInput: 
                "rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500",
              footerActionLink: "text-[#F03D3D] hover:text-[#d93636]",
              identityPreviewEditButton: "text-[#F03D3D] hover:text-[#d93636]",
              formFieldLabel: "text-gray-700 font-medium",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
              socialButtonsBlockButton: 
                "border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
              socialButtonsBlockButtonText: "text-gray-700 font-medium",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  );
}
