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
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    if (!clerk.loaded) return;
    setIsLoadingGoogle(true);
    clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  const handleEmailSignIn = async () => {
    if (!clerk.loaded || !emailAddress.trim()) return;
    setIsLoadingEmail(true);
    try {
      const signInAttempt = await clerk.client.signIn.create({
        identifier: emailAddress,
      });
      const factor = signInAttempt.supportedFirstFactors?.find(
        (f) => f.strategy === "email_link"
      ) as any;
      
      if (!factor) {
        console.error("Email link not supported for this user");
        setIsLoadingEmail(false);
        return;
      }

      const { startEmailLinkFlow } = clerk.client.signIn.createEmailLinkFlow();
      await startEmailLinkFlow({
        emailAddressId: factor.emailAddressId,
        redirectUrl: "http://localhost:3000/",
      });
      setEmailSent(true);
    } catch (err) {
      console.error("Error signing in with email:", err);
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
            Welcome back
          </h2>

          <div className="w-full max-w-[340px] flex flex-col gap-4">
            <button 
              onClick={handleGoogleSignIn}
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
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full h-[52px] bg-[#141414] border border-[#262626] rounded-2xl pl-12 pr-4 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Continue Button */}
            <button 
              onClick={handleEmailSignIn}
              disabled={isLoadingEmail || emailSent}
              className="flex items-center justify-center w-full h-[52px] bg-[#0f172a] hover:bg-[#1e293b] text-[#3b82f6] font-semibold text-[15px] rounded-2xl transition-colors mt-1 disabled:opacity-50"
            >
              {isLoadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : emailSent ? "Link Sent!" : "Continue"}
            </button>

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
