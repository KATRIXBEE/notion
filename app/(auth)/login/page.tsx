"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SketchBox,
  SketchButtonDark,
  SketchInput,
  Tabs,
  Toggle,
} from "@/components/sketch";
import { useAuth } from "@/lib/context/AuthContext";
import { useSettings } from "@/lib/context/SettingsContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, setUser, refreshUser } = useAuth();
  const { darkMode, setDarkMode } = useSettings();

  const [tab, setTab] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [step, setStep] = useState<"auth" | "confirm">("auth");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "USER_NOT_CONFIRMED") {
          setStep("confirm");
          setErrorMsg("Please enter the confirmation code sent to your email.");
          return;
        }
        setErrorMsg(data.error?.message || "Login failed");
        return;
      }

      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      window.location.href = "/home";
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Sign up failed");
        return;
      }

      if (data.autoLogin) {
        if (data.user) {
          setUser(data.user);
        } else {
          await refreshUser();
        }
        window.location.href = "/home";
        return;
      }

      setSuccessMsg("Account created! Check your email for the confirmation code.");
      setStep("confirm");
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: confirmCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Confirmation failed");
        return;
      }

      if (data.user) {
        setUser(data.user);
        window.location.href = "/home";
        return;
      }

      setSuccessMsg("Account confirmed! You can now log in.");
      setStep("auth");
      setTab("Login");
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@notionlite.local", password: "Password123" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error?.message || "Demo login failed");
        return;
      }
      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      window.location.href = "/home";
    } catch {
      setErrorMsg("Quick login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-6 relative">
      {/* Top right dark mode toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="font-sketch text-xs text-ink-soft">Dark</span>
        <Toggle seed={70} checked={darkMode} onChange={setDarkMode} />
      </div>

      <div className="w-full max-w-md">
        {/* App Title */}
        <div className="text-center mb-6">
          <h1 className="font-sketch text-4xl font-bold text-ink">NotionLite</h1>
          <p className="font-sketch text-sm text-ink-soft mt-1">
            Hand-drawn notes, backed by AWS
          </p>
        </div>

        {step === "confirm" ? (
          <SketchBox seed={101} className="p-6">
            <h2 className="font-sketch text-xl font-bold text-ink mb-2">
              Confirm your email
            </h2>
            <p className="font-sketch text-xs text-ink-soft mb-4">
              Enter the 6-digit confirmation code sent to {email}
            </p>

            {errorMsg && (
              <div className="mb-4 p-2 border border-ink font-sketch text-xs text-ink bg-paper">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-2 border border-ink font-sketch text-xs text-ink bg-paper">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4">
              <SketchInput
                seed={102}
                label="Confirmation code"
                placeholder="123456"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                required
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep("auth")}
                  className="font-sketch text-xs text-ink-soft underline cursor-pointer"
                >
                  Back to login
                </button>
                <SketchButtonDark seed={103} type="submit" disabled={loading}>
                  {loading ? "Confirming…" : "Confirm Code"}
                </SketchButtonDark>
              </div>
            </form>
          </SketchBox>
        ) : (
          <Tabs
            seed={110}
            tabs={["Login", "Signup"]}
            active={tab}
            onChange={(t) => {
              setTab(t);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            {errorMsg && (
              <div className="mb-4 p-2 border border-ink font-sketch text-xs text-ink">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-2 border border-ink font-sketch text-xs text-ink">
                {successMsg}
              </div>
            )}

            {tab === "Login" ? (
              <form onSubmit={handleLogin} className="space-y-4 pt-2">
                <SketchInput
                  seed={111}
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <SketchInput
                  seed={112}
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    className="font-sketch text-xs text-ink-soft underline cursor-pointer"
                  >
                    Need to confirm code?
                  </button>
                  <SketchButtonDark seed={113} type="submit" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </SketchButtonDark>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4 pt-2">
                <SketchInput
                  seed={114}
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <SketchInput
                  seed={115}
                  label="Password (min 8 chars, A-Z, 0-9)"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="pt-2 flex justify-end">
                  <SketchButtonDark seed={116} type="submit" disabled={loading}>
                    {loading ? "Creating account…" : "Create Account"}
                  </SketchButtonDark>
                </div>
              </form>
            )}

            {/* Quick 1-Click Demo Login Button */}
            <div className="mt-6 pt-4 border-t border-dashed border-ink/30 text-center">
              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-ink text-paper hover:bg-ink/90 font-sketch text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2 border border-ink shadow-sm"
              >
                <span>⚡</span>
                <span>{loading ? "Signing in…" : "Quick Demo Login (1-Click)"}</span>
              </button>
              <p className="font-sketch text-xs text-ink-soft mt-1.5">
                Instant access with local demo account — no AWS credentials needed
              </p>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
