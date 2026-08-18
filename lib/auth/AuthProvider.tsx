"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "[Auth] getSession error:",
            error
          );

          setSession(null);
          setUser(null);
        } else {
          setSession(
            data.session ?? null
          );

          setUser(
            data.session?.user ??
              null
          );
        }

        setLoading(false);
      };

    void initializeAuth();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            nextSession ?? null
          );

          setUser(
            nextSession?.user ??
              null
          );

          setLoading(false);
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",
            options: {
              redirectTo:
                `${window.location.origin}/auth/callback`,
            },
          }
        );

      if (error) {
        console.error(
          "[Auth] Google sign-in error:",
          error
        );

        throw error;
      }
    };

  const signOut =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "[Auth] sign-out error:",
          error
        );

        throw error;
      }
    };

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
      }),
      [
        user,
        session,
        loading,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}