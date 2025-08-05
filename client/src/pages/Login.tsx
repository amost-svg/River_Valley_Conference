import { useEffect } from "react";
import { useLocation } from "wouter";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [location] = useLocation();
  
  // Check for error messages in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  
  let errorMessage = '';
  if (error === 'auth_failed') {
    errorMessage = 'Authentication failed. Please try again or contact support if you need an account.';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-conference-navy via-blue-800 to-conference-gold flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <GoogleLoginButton />
        
        <div className="text-center">
          <a 
            href="/" 
            className="text-white hover:text-conference-gold transition-colors"
          >
            ← Back to Conference Website
          </a>
        </div>
      </div>
    </div>
  );
}