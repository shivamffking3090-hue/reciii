import React, { useState } from "react";
import { registerEmailPassword, loginEmailPassword, isMockDb } from "../services/firebase";
import { ChefHat, Mail, Lock, User, Key, Eye, EyeOff, CheckCircle } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (user: { uid: string; email: string; displayName: string }) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isForgot) {
        // Forgot Password Mock/Native Workflow
        if (!email.trim()) throw new Error("Please enter your registered email address.");
        
        setSuccessMsg(`A high-priority password reset verification link has been dispatched to: ${email}. Please check your inbox within 5 minutes.`);
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login Workflow
        if (!email.trim() || !password.trim()) throw new Error("Please fill in all requested login fields.");
        const user = await loginEmailPassword(email.trim(), password);
        onAuthSuccess(user);
      } else {
        // Registration Workflow
        if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
          throw new Error("All fields are mandatory to secure an ecosystem profile.");
        }
        if (password !== confirmPassword) {
          throw new Error("Password mapping keys do not match. Please verify.");
        }
        if (password.length < 6) {
          throw new Error("A secure key requires a minimum of 6 characters.");
        }

        const user = await registerEmailPassword(email.trim(), password, fullName.trim());
        setSuccessMsg("Registration successful! Initiating your gourmet environment.");
        setTimeout(() => {
          onAuthSuccess(user);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication security error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col justify-center items-center p-4">
      
      {/* Visual Header Brand */}
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center border border-primary-500 mb-3 animate-pulse">
          <ChefHat className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-neutral-900">
          AI Recipe Generator
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Your intelligent full-stack gourmet cooking assistant
        </p>
      </div>

      {/* Main Authentic Interface Box */}
      <div className="w-full max-w-md bg-neutral-50/50 rounded-2xl border border-neutral-100 p-6 md:p-8 shadow-sm">
        
        {/* Toggle Title */}
        <h2 className="text-xl font-display font-medium text-neutral-900 mb-6">
          {isForgot ? "Reset Secret Key" : isLogin ? "Welcome Back" : "Create Chef Account"}
        </h2>

        {/* Dynamic State Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg mb-4 flex items-start gap-2">
            <span className="font-semibold">Security Alert:</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-primary-500" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Custom Name field (Only during Registration) */}
          {!isLogin && !isForgot && (
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Antoinette Gourmet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 transition-all placeholder:text-neutral-300"
                />
              </div>
            </div>
          )}

          {/* Email input field */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="chef@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 transition-all placeholder:text-neutral-300"
                required
              />
            </div>
          </div>

          {/* Password input field */}
          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-neutral-500">
                  Password Key
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(null); }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 transition-all placeholder:text-neutral-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password field (Only during Registration) */}
          {!isLogin && !isForgot && (
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Confirm Password Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 transition-all placeholder:text-neutral-300"
                  required
                />
              </div>
            </div>
          )}

          {/* Remember Option */}
          {isLogin && !isForgot && (
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-neutral-500 cursor-pointer">
                Keep my executive session remembered
              </label>
            </div>
          )}

          {/* Core submit CTA button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-sm disabled:bg-primary-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : null}
            {isForgot ? "Dispatched Reset Link" : isLogin ? "Secure Login" : "Establish Profile"}
          </button>
        </form>

        {/* Bottom Switcher Actions */}
        <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
          {isForgot ? (
            <button
              onClick={() => { setIsForgot(false); setSuccessMsg(null); setError(null); }}
              className="text-xs font-medium text-primary-500 hover:underline"
            >
              Back to Login Portal
            </button>
          ) : (
            <p className="text-xs text-neutral-400">
              {isLogin ? "New user with ingredients?" : "Already registered cooking session?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-primary-500 hover:underline"
              >
                {isLogin ? "Create credentials" : "Authenticate profile"}
              </button>
            </p>
          )}
        </div>

        {isMockDb && (
          <div className="mt-4 p-2 bg-neutral-100 rounded text-center">
            <span className="text-[10px] text-neutral-400 font-mono tracking-tight uppercase">
              Sandbox Offline Emulation Active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
