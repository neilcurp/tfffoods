"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { CustomUser } from "@/types";
import { cachedGet } from "@/utils/services/clientCache";

interface UserDataResponse {
  authenticated: boolean;
  user: CustomUser | null;
}

interface UserContextType {
  userData: CustomUser | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchUserData = useCallback(async (force = false) => {
    // Guard against overlapping fetches (session object identity changes
    // on many re-renders and would otherwise trigger duplicate requests).
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      // Shared cache with cartStore.loadServerCart so simultaneous
      // userData reads collapse into a single network request.
      const data = await cachedGet<UserDataResponse>("/api/userData", {
        force,
      });
      if (data.authenticated) {
        setUserData(data.user);
      } else {
        setUserData(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data");
      setUserData(null);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    setLoading(true);
    await fetchUserData(true);
  }, [fetchUserData]);

  // Depend on the user's email (a stable primitive) rather than the whole
  // session object, so we fetch once per sign-in instead of on every render.
  const sessionEmail = session?.user?.email ?? null;
  useEffect(() => {
    if (status === "authenticated" && sessionEmail) {
      fetchUserData();
    } else if (status === "unauthenticated") {
      setUserData(null);
      setLoading(false);
    }
  }, [status, sessionEmail, fetchUserData]);

  return (
    <UserContext.Provider value={{ userData, loading, error, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
}
