"use client";
import { AuthProvider } from "./lib/auth";

export default function ClientProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
