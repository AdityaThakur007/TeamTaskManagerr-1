import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export type AppRole = "Admin" | "Member";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: AppRole;
  token?: string;
}

interface AuthContextValue {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  login: (data: any) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setRole(parsed.role);
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setRole(userData.role);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
  };

  async function signOut() {
    setUser(null);
    setRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/portal";
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}