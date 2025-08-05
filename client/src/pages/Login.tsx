import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import LoginForm from "@/pages/LoginForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
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
        
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password Login</TabsTrigger>
            <TabsTrigger value="google">Google Login</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="google" className="mt-4">
            <GoogleLoginButton />
            <div className="text-center mt-4">
              <a 
                href="/" 
                className="text-white hover:text-conference-gold transition-colors"
              >
                ← Back to Conference Website
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}