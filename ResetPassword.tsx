import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, TriangleAlert } from "lucide-react";
import {
  captureAuthSessionFromUrl,
  getAuthFlowFromUrl,
  type RvcAuthFlow,
  type RvcAuthSession,
  updatePassword,
} from "@/lib/supabaseAuth";

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

type PageState = "loading" | "ready" | "invalid" | "saving" | "success";

function getPageCopy(flow: RvcAuthFlow) {
  if (flow === "invite") {
    return {
      title: "Create your RVC portal password",
      description: "Finish setting up your River Valley Conference administrator account.",
      button: "Create password",
      success: "Your RVC portal account is ready.",
    };
  }

  if (flow === "recovery") {
    return {
      title: "Reset your RVC portal password",
      description: "Choose a new password for your River Valley Conference account.",
      button: "Reset password",
      success: "Your password has been reset.",
    };
  }

  return {
    title: "Set your RVC portal password",
    description: "Choose a secure password for your River Valley Conference account.",
    button: "Save password",
    success: "Your password has been saved.",
  };
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const initialFlow = useMemo(getAuthFlowFromUrl, []);
  const [flow] = useState<RvcAuthFlow>(initialFlow);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [session, setSession] = useState<RvcAuthSession | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const copy = getPageCopy(flow);

  useEffect(() => {
    let active = true;

    captureAuthSessionFromUrl()
      .then((nextSession) => {
        if (!active) return;
        if (!nextSession) {
          setError("This account link is invalid, expired, or has already been used.");
          setPageState("invalid");
          return;
        }
        setSession(nextSession);
        window.history.replaceState({}, document.title, "/reset-password");
        setPageState("ready");
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Unable to verify this account link.");
        setPageState("invalid");
      });

    return () => {
      active = false;
    };
  }, []);

  const validationMessages = useMemo(() => {
    if (!password) return [];
    const result = passwordSchema.safeParse(password);
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  }, [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Please choose a stronger password.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    if (!session) {
      setError("Your secure account session has expired. Request a new link and try again.");
      setPageState("invalid");
      return;
    }

    setPageState("saving");
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmation("");
      setPageState("success");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save the password.");
      setPageState("ready");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-conference-navy via-blue-800 to-conference-gold flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-conference-navy">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-conference-navy">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {pageState === "loading" && (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying your secure account link…
            </div>
          )}

          {pageState === "invalid" && (
            <div className="space-y-5">
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Unable to use this link</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={() => setLocation("/login")}>Return to sign in</Button>
                <Button onClick={() => setLocation("/login?forgot=password")}>Request another link</Button>
              </div>
            </div>
          )}

          {(pageState === "ready" || pageState === "saving") && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-11"
                    disabled={pageState === "saving"}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use at least 10 characters with uppercase, lowercase, and a number.
                </p>
                {validationMessages.length > 0 && (
                  <ul className="space-y-1 text-xs text-destructive" aria-live="polite">
                    {validationMessages.map((message) => <li key={message}>{message}</li>)}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  disabled={pageState === "saving"}
                />
              </div>

              <Button type="submit" className="w-full" disabled={pageState === "saving"}>
                {pageState === "saving" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                ) : copy.button}
              </Button>
            </form>
          )}

          {pageState === "success" && (
            <div className="space-y-5">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                <AlertTitle>{copy.success}</AlertTitle>
                <AlertDescription>You are signed in and may continue to the administrator dashboard.</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setLocation("/admin")}>Continue to dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
