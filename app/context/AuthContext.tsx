import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  phone: string;
  dob: string;
  gender: string;
  address: { line1: string; line2: string };
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (t: string) => {
    try {
      const { data } = await axiosInstance.get("/api/user/get-profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (data.success) setUser(data.userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const login = async (t: string) => {
    await SecureStore.setItemAsync("token", t);
    setToken(t);
    await fetchUser(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const stored = await SecureStore.getItemAsync("token");
        if (stored) {
          setToken(stored);
          await fetchUser(stored);
        }
      } catch (error) {
        console.error("Token load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
