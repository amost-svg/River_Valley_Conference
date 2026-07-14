import { useCallback, useEffect, useState } from "react";
import { authChangeEventName, getRvcUserContext } from "@/lib/supabaseAuth";

interface User {
  id: any;
  email: string;
  name: string;
  role: string;
  schoolId: any;
  isSuperAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const context = await getRvcUserContext();
      setUser((context ?? undefined) as User | undefined);
      setError(null);
    } catch (nextError) {
      setUser(undefined);
      setError(nextError instanceof Error ? nextError : new Error("Unable to load the account."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleChange = () => void refresh();
    window.addEventListener(authChangeEventName, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(authChangeEventName, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refresh]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user) && !error,
    isError: Boolean(error),
    error,
    refresh,
  };
}
