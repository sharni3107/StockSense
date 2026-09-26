import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { apiFetch } from "../api/client";
import { fetchMe, User } from "../api/auth";

interface AuthContextValue {
  user: User | null;
  session: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchMe();
      setUser(profile);
      setSession(true);
    } catch {
      setUser(null);
      setSession(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  async function login(email: string, password: string) {
    await apiFetch<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refreshUser();
  }

  async function register(name: string, email: string, password: string) {
    await apiFetch<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    await refreshUser();
  }

  async function logout() {
    try {
      await apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setSession(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
