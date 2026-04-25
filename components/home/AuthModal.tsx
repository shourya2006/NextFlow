"use client";

import { X, Mail, Loader2 } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export default function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const clerk = useClerk();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = () => {
    if (!clerk.loaded) return;
    setIsLoadingGoogle(true);
    
    const authAction = mode === "signUp" ? clerk.client.signUp : clerk.client.signIn;
    
    authAction.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  const handleEmailAuth = async () => {
    if (!clerk.loaded || !emailAddress.trim()) return;
    setIsLoadingEmail(true);
    try {
      if (mode === "signUp") {
        if (!password) return;
        await clerk.client.signUp.create({
          emailAddress,
          password,
        });
        await clerk.client.signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setNeedsVerification(true);
      } else {
        // For Sign In, we require password
        if (!password) {
          alert("Please enter a password");
          setIsLoadingEmail(false);
          return;
        }

        const result = await clerk.client.signIn.create({
          identifier: emailAddress,
          password,
        });
        if (result.status === "complete") {
          clerk.setActive({ session: result.createdSessionId });
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      alert(err.errors?.[0]?.message || "An error occurred");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleVerify = async () => {
    if (!clerk.loaded || !code) return;
    setIsLoadingEmail(true);
    try {
      const result = await clerk.client.signUp.attemptEmailAddressVerification({
        code,
      });
      if (result.status === "complete") {
        clerk.setActive({ session: result.createdSessionId });
        onClose();
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      alert(err.errors?.[0]?.message || "Invalid code");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative flex w-full max-w-[900px] h-[580px] bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-[#262626]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Left Side: Auth Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-8 relative">
          <h2 className="text-[32px] font-bold text-white mb-10 tracking-tight">
            {needsVerification ? "Check your email" : (mode === "signIn" ? "Welcome back" : "Create an account")}
          </h2>

          <div className="w-full max-w-[340px] flex flex-col gap-4">
            {needsVerification ? (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={code || ""}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-[52px] bg-[#141414] border border-[#262626] rounded-2xl px-4 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={handleVerify}
                  disabled={isLoadingEmail}
                  className="flex items-center justify-center w-full h-[52px] bg-[#0f172a] hover:bg-[#1e293b] text-[#3b82f6] font-semibold text-[15px] rounded-2xl transition-colors mt-1 disabled:opacity-50"
                >
                  {isLoadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleGoogleAuth}
                  disabled={isLoadingGoogle}
                  className="relative flex items-center justify-center w-full h-[52px] bg-white hover:bg-zinc-100 text-black font-semibold text-[15px] rounded-2xl transition-colors disabled:opacity-50"
                >
                  <div className="absolute left-5 flex items-center justify-center">
                    {isLoadingGoogle ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                      />
                    )}
                  </div>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center justify-center w-full my-3">
                  <span className="text-[13px] font-medium text-zinc-600 tracking-wider">
                    OR
                  </span>
                </div>

                {/* Email Input */}
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                    strokeWidth={1.5}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={emailAddress || ""}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full h-[52px] bg-[#141414] border border-[#262626] rounded-2xl pl-12 pr-4 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password || ""}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[52px] bg-[#141414] border border-[#262626] rounded-2xl px-4 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Continue Button */}
                <button 
                  onClick={handleEmailAuth}
                  disabled={isLoadingEmail}
                  className="flex items-center justify-center w-full h-[52px] bg-[#0f172a] hover:bg-[#1e293b] text-[#3b82f6] font-semibold text-[15px] rounded-2xl transition-colors mt-1 disabled:opacity-50"
                >
                  {isLoadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </button>

                {/* Mode Switcher */}
                <div className="text-center mt-2">
                  <button
                    onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
                    className="text-[13px] text-zinc-400 hover:text-white transition-colors"
                  >
                    {mode === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>

                {/* Terms text */}
                <p className="text-[13px] text-zinc-500 text-center mt-6 leading-relaxed">
                  By continuing, you agree to Krea's
                  <br />
                  <a href="#" className="text-[#3b82f6] hover:underline">
                    Terms of Use
                  </a>{" "}
                  &{" "}
                  <a href="#" className="text-[#3b82f6] hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="flex-1 relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"
            alt="Landscape"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
