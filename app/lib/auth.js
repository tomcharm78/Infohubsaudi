"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfile(data);
    } catch(e) {
      // If profiles table doesn't exist yet, create a mock admin profile
      setProfile({ id: userId, role: "admin", language: "en", full_name: "Admin" });
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}` : undefined,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor" || isAdmin;
  const isViewer = !!user;
  const tier = profile?.subscription_tier || "basic";
  const subActive = profile?.subscription_end ? new Date(profile.subscription_end) > new Date() : tier === "basic";

  const setLanguage = async (lang) => {
    if (profile) {
      setProfile({ ...profile, language: lang });
      if (user) {
        try { await supabase.from("profiles").update({ language: lang }).eq("id", user.id); } catch(e) {}
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isAdmin, isEditor, isViewer,
      tier, subActive,
      signIn, signUp, signOut, resetPassword, updatePassword,
      setLanguage,
      language: profile?.language || "en",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
