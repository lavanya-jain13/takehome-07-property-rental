import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { login as loginRequest } from "../services/auth.service";
import type {
  LoginRequest,
  User,
} from "../types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null
  );
  const [isLoading, setIsLoading] =
    useState(false);

  const login = async (
    credentials: LoginRequest
  ) => {
    setIsLoading(true);

    try {
      const response =
        await loginRequest(credentials);

      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}