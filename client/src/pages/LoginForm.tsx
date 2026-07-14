import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { sendPasswordReset, signInWithPassword } from "@/lib/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(
    () => new URLSearchParams(window.location.search).get("forgot") === "password",
  );
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => signInWithPassword(data.email, data.password),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast({
        title: "Login successful",
        description: "Welcome back to the River Valley Conference dashboard.",
      });
      setLocation("/admin");
    },
    onError: (nextError: unknown) => {
      setError(nextError instanceof Error ? nextError.message : "Login failed. Please try again.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (email: string) => sendPasswordReset(email),
    onSuccess: () => {
      setResetSent(true);
      setError("");
    },
    onError: (nextError: unknown) => {
      setError(nextError instanceof Error ? nextError.message : "Unable to send the password reset email.");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setError("");
    loginMutation.mutate(data);
  };

  const handleForgotPassword = () => {
    const nextValue = !showForgotPassword;
    setShowForgotPassword(nextValue);
    setResetSent(false);
    setError("");
    if (nextValue && !resetEmail) setResetEmail(form.getValues("email"));
  };

  const handleResetRequest = () => {
    const parsed = z
      .string()
      .email("Enter the email address used for your RVC account.")
      .safeParse(resetEmail.trim());

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setError("");
    setResetSent(false);
    resetMutation.mutate(parsed.data.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-conference-navy via-blue-800 to-conference-gold flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-conference-navy">River Valley Conference</CardTitle>
            <CardDescription>Sign in to the administrator dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="your.email@school.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-conference-navy hover:bg-blue-800 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                  ) : "Sign in"}
                </Button>
              </form>
            </Form>

            <div className="space-y-2 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="cursor-pointer text-conference-navy hover:underline"
              >
                Forgot your password?
              </button>

              {showForgotPassword && (
                <div className="space-y-3 rounded border bg-blue-50 p-3 text-left">
                  {resetSent ? (
                    <div className="flex gap-2 text-sm text-green-800" role="status">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>If that email belongs to an RVC account, a password-reset link has been sent.</p>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor="reset-email" className="text-sm">Account email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
                          value={resetEmail}
                          onChange={(event) => setResetEmail(event.target.value)}
                          placeholder="your.email@school.org"
                          className="pl-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleResetRequest}
                        disabled={resetMutation.isPending}
                      >
                        {resetMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                        ) : "Send reset link"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/" className="text-white transition-colors hover:text-conference-gold">
            ← Back to Conference Website
          </a>
        </div>
      </div>
    </div>
  );
}
