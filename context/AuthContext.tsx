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

interface Doctor {
  _id: string;
  name: string;
  email: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
}

interface AuthContextType {
  token: string | null;
  dToken: string | null;
  user: User | null;
  doctor: Doctor | null;
  role: "patient" | "doctor" | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  doctorLogin: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [dToken, setDToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
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

  const fetchDoctor = async (t: string) => {
    try {
      const { data } = await axiosInstance.get("/api/doctor/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (data.success) setDoctor(data.profileData);
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
    }
  };

  const login = async (t: string) => {
    await SecureStore.setItemAsync("token", t);
    await SecureStore.deleteItemAsync("dToken");
    setToken(t);
    setDToken(null);
    setDoctor(null);
    setRole("patient");
    await fetchUser(t);
  };

  const doctorLogin = async (t: string) => {
    await SecureStore.setItemAsync("dToken", t);
    await SecureStore.deleteItemAsync("token");
    setDToken(t);
    setToken(null);
    setUser(null);
    setRole("doctor");
    await fetchDoctor(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("dToken");
    setToken(null);
    setDToken(null);
    setUser(null);
    setDoctor(null);
    setRole(null);
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
    if (dToken) await fetchDoctor(dToken);
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        const storedDToken = await SecureStore.getItemAsync("dToken");

        if (storedToken) {
          setToken(storedToken);
          setRole("patient");
          await fetchUser(storedToken);
        } else if (storedDToken) {
          setDToken(storedDToken);
          setRole("doctor");
          await fetchDoctor(storedDToken);
        }
      } catch (error) {
        console.error("Token load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTokens();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        dToken,
        user,
        doctor,
        role,
        loading,
        login,
        doctorLogin,
        logout,
        refreshUser,
      }}
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
