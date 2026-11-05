"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  KeyRound, 
  Mail, 
  Terminal, 
  Lock, 
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StampLabel } from "@/components/ui/StampLabel";
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
  const [statusLog, setStatusLog] = useState("AWAITING AGENT CREDENTIALS");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    soundFX.playBlip();

    setStatusLog("ESTABLISHING SECURE CIPHER TUNNEL...");
    await new Promise((r) => setTimeout(r, 400));

    setStatusLog("VALIDATING AGENT BIOMETRICS & PERMISSIONS...");
    const res = await onLogin(email, password, isSignUp);

    if (res.success) {
      setStatusLog("ACCESS GRANTED. INITIALIZING OPERATION: ME...");
      soundFX.playTargetAcquired();
    } else {
      setLoading(false);
      setErrorMsg(res.error || "AUTHORIZATION REJECTED. CREDENTIALS INVALID.");
      setStatusLog("ACCESS DENIED // INCIDENT LOGGED");
      soundFX.playWarning();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-mono">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spy-green/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-spy-surface border-2 border-spy-border tactical-card p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative"
      >
        {/* Top classified stamp */}
        <div className="flex justify-between items-center mb-6 border-b border-spy-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-spy-green animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-white">
              OPERATION: ME // HEADQUARTERS
            </span>
          </div>
          <StampLabel text="TOP SECRET" variant="danger" size="sm" rotate={4} />
        </div>

        {/* Agency Briefing Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase">
            AGENT AUTHORIZATION
          </h1>
          <p className="text-xs text-spy-dim mt-1 tracking-wider">
            RESTRICTED ACCESS // LEVEL 5 PROTOCOL
          </p>
        </div>

        {/* Terminal status bar */}
        <div className="mb-5 bg-black/70 border border-spy-border p-2.5 text-[11px] text-spy-green flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-spy-green shrink-0" />
          <span className="truncate">{statusLog}</span>
        </div>

        {errorMsg && (
          <div className="mb-5 bg-red-950/40 border border-spy-red p-3 text-xs text-spy-red flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-spy-red shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Agent Identifier */}
          <div>
            <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-spy-green" />
              <span>Agent Callout / Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent.akib@agency.internal"
              className="w-full bg-black/60 border border-spy-border px-3 py-2.5 text-sm text-spy-text focus:outline-none focus:border-spy-green font-mono"
            />
          </div>

          {/* Clearance Passcode */}
          <div>
            <label className="block text-spy-dim uppercase tracking-wider mb-1 font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-spy-green" />
              <span>Clearance Passcode</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/60 border border-spy-border px-3 py-2.5 text-sm text-spy-text focus:outline-none focus:border-spy-green font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-spy-green"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full shadow-spy-green mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isSignUp ? "INITIALIZE AGENT RECORD" : "DECRYPT & ENTER TERMINAL"}</span>
          </Button>

          {/* Toggle Sign in / Sign up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] text-slate-400 hover:text-spy-green transition-colors underline"
            >
              {isSignUp
                ? "Already registered operative? Enter with existing credentials"
                : "New operative in field? Request authorization (Sign Up)"}
            </button>
          </div>
        </form>

        {/* Demo / Offline Bypass Option */}
        <div className="mt-6 pt-5 border-t border-spy-border text-center">
          <div className="text-[11px] text-spy-dim mb-2">
            {isSupabaseConnected ? (
              <span className="text-spy-green">● SUPABASE CLOUD DATABASE CONNECTED</span>
            ) : (
              <span className="text-amber-400">● LOCAL TACTICAL CACHE ACTIVE (SUPABASE READY)</span>
            )}
          </div>

          <button
            type="button"
            onClick={onGuestBypass}
            className="w-full py-2 bg-black/50 hover:bg-spy-card border border-slate-700 hover:border-spy-green/60 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-spy-green" />
            <span>AUTHENTICATE AS AGENT AKIB (DIRECT ACCESS)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

