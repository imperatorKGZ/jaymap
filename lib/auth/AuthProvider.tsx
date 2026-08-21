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
import type { Database } from "@/lib/supabase/database.types";

type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

async function fetchProfile(
  userId: string
): Promise<Profile | null> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Auth] profile fetch error:",
      error
    );

    return null;
  }

  return data;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const refreshProfile =
    async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);

      try {
        const nextProfile =
          await fetchProfile(
            user.id
          );

        setProfile(
          nextProfile
        );
      } finally {
        setProfileLoading(false);
      }
    };

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

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
          setProfile(null);
        } else {
          const nextSession =
            data.session ?? null;

          const nextUser =
            nextSession?.user ??
            null;

          setSession(
            nextSession
          );

          setUser(
            nextUser
          );

          if (nextUser) {
            setProfileLoading(
              true
            );

            const nextProfile =
              await fetchProfile(
                nextUser.id
              );

            if (mounted) {
              setProfile(
                nextProfile
              );

              setProfileLoading(
                false
              );
            }
          } else {
            setProfile(
              null
            );
          }
        }

        setLoading(false);
      };

    void initializeAuth();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          nextSession
        ) => {
          if (!mounted) {
            return;
          }

          const nextUser =
            nextSession?.user ??
            null;

          setSession(
            nextSession ?? null
          );

          setUser(
            nextUser
          );

          if (!nextUser) {
            setProfile(
              null
            );

            setProfileLoading(
              false
            );

            setLoading(false);

            return;
          }

          setProfileLoading(
            true
          );

          const nextProfile =
            await fetchProfile(
              nextUser.id
            );

          if (!mounted) {
            return;
          }

          setProfile(
            nextProfile
          );

          setProfileLoading(
            false
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

      setUser(null);
      setSession(null);
      setProfile(null);
    };

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        session,
        profile,
        loading,
        profileLoading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }),
      [
        user,
        session,
        profile,
        loading,
        profileLoading,
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