"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { soundFX } from "@/lib/sound";
import { validateSupabaseConfig } from "@/lib/supabase/config";
import { LogoIcon } from "@/components/ui/LogoIcon";

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword?: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onGuestBypass?: () => void;
  isSupabaseConnected?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onResetPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResetNotice("");
    setLoading(true);
    soundFX.playBlip();

    const res = await onLogin(email, password);

    if (res.success) {
      soundFX.playTargetAcquired();
    } else {
      setLoading(false);
      setErrorMsg(res.error || "Authentication failed. Invalid credentials.");
      soundFX.playWarning();
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.trim()) {
      setErrorMsg("Please enter your email address to reset password.");
      soundFX.playWarning();
      return;
    }
    setErrorMsg("");
    setResetNotice("");
    setResetLoading(true);
    soundFX.playBlip();

    try {
      if (onResetPassword) {
        const res = await onResetPassword(email.trim());
        if (res.success) {
          setResetNotice(res.message || "Password recovery email dispatched. Check your inbox.");
          soundFX.playTargetAcquired();
        } else {
          setErrorMsg(res.error || "Failed to dispatch password recovery email.");
          soundFX.playWarning();
        }
      } else {
        setResetNotice("Password reset request submitted. Check your inbox.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset request failed.";
      setErrorMsg(msg);
      soundFX.playWarning();
    } finally {
      setResetLoading(false);
    }
  };

  const configStatus = validateSupabaseConfig();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8faf9] dark:bg-spy-bg text-spy-text">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white dark:bg-spy-surface border border-gray-200 dark:border-spy-border shadow-2xl rounded-[8px] p-6 sm:p-8"
      >
        {/* Title */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-spy-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-[5px] bg-[#dcf3e4] text-[#14663a] border border-[#b9e7c8] dark:bg-spy-surface2 dark:text-spy-green dark:border-spy-border flex items-center justify-center shrink-0">
              <LogoIcon className="w-4 h-4 text-[#14663a] dark:text-spy-green" />
            </div>
            <div>
              <div className="text-sm font-mono font-bold tracking-widest text-[#14663a] dark:text-spy-green uppercase">
                OPERATION: ME
              </div>
              <div className="text-[10px] font-mono text-gray-500 dark:text-spy-muted uppercase tracking-wider">
                Tactical Mission Control
              </div>
            </div>
          </div>
          <h1 className="text-xl font-bold font-mono text-gray-900 dark:text-spy-text tracking-tight mt-2">
            Agent Authorization
          </h1>
          <p className="text-xs text-gray-500 dark:text-spy-muted mt-1 font-sans">
            Cloud Authentication Required · Supabase Single Source of Truth
          </p>
        </div>

        {/* Themed Error Message */}
        {errorMsg && (
          <div 
            role="alert"
            className="mb-4 bg-red-50 dark:bg-spy-danger-surface border border-red-200 dark:border-spy-red/30 p-3 rounded-[4px] text-xs text-red-600 dark:text-spy-red flex items-start gap-2 font-mono"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Themed Reset Password Notice */}
        {resetNotice && (
          <div 
            role="status"
            className="mb-4 bg-emerald-50 dark:bg-spy-green/10 border border-emerald-200 dark:border-spy-green/30 p-3 rounded-[4px] text-xs text-emerald-700 dark:text-spy-green flex items-start gap-2 font-mono"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-spy-green shrink-0 mt-0.5" />
            <span>{resetNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Email field */}
          <div>
            <label htmlFor="agent-email" className="block text-gray-700 dark:text-spy-muted mb-1.5 font-mono text-[11px] uppercase tracking-wider font-bold">
              Email Address
            </label>
            <div className="relative">
              <input
                id="agent-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="you@example.com"
                className="w-full bg-white dark:bg-spy-surface2 border border-gray-300 dark:border-spy-border px-3.5 py-2.5 text-sm text-gray-900 dark:text-spy-text placeholder:text-gray-400 dark:placeholder:text-spy-dim focus:outline-none focus:border-spy-green focus:ring-1 focus:ring-spy-green rounded-[4px] shadow-2xs font-sans"
              />
            </div>
          </div>

          {/* Passcode field with Show/Hide toggle & Forgot password link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="agent-password" className="block text-gray-700 dark:text-spy-muted font-mono text-[11px] uppercase tracking-wider font-bold">
                Passcode
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[11px] font-mono text-gray-500 dark:text-spy-muted hover:text-spy-green transition-colors underline focus:outline-none"
              >
                {resetLoading ? "Sending link..." : "Forgot password?"}
              </button>
            </div>
            <div className="relative">
              <input
                id="agent-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="••••••••••••"
                className="w-full bg-white dark:bg-spy-surface2 border border-gray-300 dark:border-spy-border px-3.5 py-2.5 text-sm text-gray-900 dark:text-spy-text placeholder:text-gray-400 dark:placeholder:text-spy-dim focus:outline-none focus:border-spy-green focus:ring-1 focus:ring-spy-green rounded-[4px] shadow-2xs pr-10 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-spy-muted dark:hover:text-spy-text p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button with Loading State */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            disabled={loading}
            className="w-full mt-3 font-mono font-bold bg-[#14663a] hover:bg-[#0f4d2c] text-white dark:bg-spy-green dark:text-black dark:hover:bg-spy-green/90 py-2.5 text-sm shadow-md"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "Authenticating..." : "Authenticate"}</span>
          </Button>
        </form>

        {/* Configuration Status Warnings */}
        {configStatus.status === "secret_key_blocked" && (
          <div className="mt-5 text-left text-[11px] font-mono text-spy-red bg-spy-danger-surface border border-spy-red/40 p-2.5 rounded-[3px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-spy-red shrink-0 mt-0.5" />
            <span>{configStatus.message}</span>
          </div>
        )}
        {(configStatus.status === "malformed_url" || configStatus.status === "invalid_key" || configStatus.status === "missing") && (
          <div className="mt-5 text-left text-[11px] font-mono text-spy-amber bg-spy-amberMuted border border-spy-amber/40 p-2.5 rounded-[3px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-spy-amber shrink-0 mt-0.5" />
            <span>{configStatus.message}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
