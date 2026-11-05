"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { soundFX } from "@/lib/sound";

interface LoginPageProps {
  onLogin: (email: string, pass: string, isSignUp?: boolean) => Promise<{ success: boolean; error?: string }>;
  onGuestBypass: () => void;
  isSupabaseConnected: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onGuestBypass,
  isSupabaseConnected,
}) => {
  const [email, setEmail] = useState("akib@agency.internal");
  const [password, setPassword] = useState("classified-pass-2026");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    soundFX.playBlip();

    const res = await onLogin(email, password, isSignUp);

    if (res.success) {
      soundFX.playTargetAcquired();
    } else {
      setLoading(false);
      setErrorMsg(res.error || "Authentication failed. Invalid credentials.");
      soundFX.playWarning();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f0d] text-slate-200">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#111714] border border-spy-border rounded-[6px] p-6 sm:p-8"
      >
        {/* Title */}
        <div className="mb-6 pb-4 border-b border-spy-border">
          <div className="text-xs font-mono font-medium text-spy-green uppercase tracking-wider mb-1">
            OPERATION: ME
          </div>
          <h1 className="text-xl font-medium text-white tracking-tight">
            Agent Authorization
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access portal for Agent Akib
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-950/30 border border-red-800/40 p-3 rounded-[4px] text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-spy-red shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Agent Identifier */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Email / Agent ID
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent.akib@agency.internal"
                className="w-full bg-[#141d18] border border-spy-border px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-spy-borderLight rounded-[3px]"
              />
            </div>
          </div>

          {/* Clearance Passcode */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141d18] border border-spy-border px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-spy-borderLight rounded-[3px] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isSignUp ? "Register Account" : "Authenticate"}</span>
          </Button>

          {/* Toggle Sign in / Sign up */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
            >
              {isSignUp
                ? "Existing agent? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </form>

        {/* Demo / Offline Bypass Option */}
        <div className="mt-6 pt-5 border-t border-spy-border">
          <button
            type="button"
            onClick={onGuestBypass}
            className="w-full py-2 bg-[#141d18] hover:bg-[#18231d] border border-spy-border text-xs text-slate-300 hover:text-white transition-colors rounded-[3px] flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-spy-green" />
            <span>Direct Access as Agent Akib</span>
          </button>

          {isSupabaseConnected && (
            <div className="mt-3 text-center text-[11px] font-mono text-slate-500">
              Supabase Connection Active
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
