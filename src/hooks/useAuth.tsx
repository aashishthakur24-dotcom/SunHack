import React, { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/types/app";
import { authService, profileService, type LocalUser } from "@/lib/supabase-backend";

interface AuthContextType {
  user: LocalUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (localUser) => {
      setUser(localUser);
      if (localUser) {
        const syncedProfile = await profileService.getOrCreateProfile(localUser);
        setProfile(syncedProfile);
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "decisions" });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    await authService.register(email, password, name);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithGithub = async () => {
    await authService.signInWithGithub();
  };

  const logout = async () => {
    await authService.logout();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, register, signInWithGoogle, signInWithGithub, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

