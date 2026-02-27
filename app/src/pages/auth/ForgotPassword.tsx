import React, { useEffect, useState } from 'react';
import { Mail, KeyRound, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from '@/config/routes';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, resetPassword } from '@/lib/slices/AuthSlice';

const OTP_COOLDOWN_SECONDS = 60;

function getInitialCooldownSeconds() {
  const lastResendTime = sessionStorage.getItem('lastOTPResend');
  if (!lastResendTime) return 0;

  const parsed = Number.parseInt(lastResendTime, 10);
  if (Number.isNaN(parsed)) {
    sessionStorage.removeItem('lastOTPResend');
    return 0;
  }

  const timeSinceLastResend = Date.now() - parsed;
  const remainingTimeMs = Math.max(0, OTP_COOLDOWN_SECONDS * 1000 - timeSinceLastResend);

  if (remainingTimeMs <= 0) {
    sessionStorage.removeItem('lastOTPResend');
    return 0;
  }

  return Math.ceil(remainingTimeMs / 1000);
}

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const resetToken = useAppSelector(s => s.auth.resetToken); // Get reset token from Redux state

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false); // Step 1 -> 2
  const [isVerified, setIsVerified] = useState(false);   // Step 2 -> 3
  const [isLoading, setIsLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(getInitialCooldownSeconds);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const canResendOtp = timeLeft === 0;

  const startOtpCooldown = () => {
    sessionStorage.setItem('lastOTPResend', Date.now().toString());
    setTimeLeft(OTP_COOLDOWN_SECONDS);
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          sessionStorage.removeItem('lastOTPResend');
        }
        return next;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [timeLeft]);

  function validatePassword(password: string) {
    if (!password) return "Password is required";

    if (password.length < 6) return "Password must be at least 6 characters";

    return null;
  }

  // Step 1: Request OTP
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(res)) {
      setIsLoading(false);
      setIsSubmitted(true);

      startOtpCooldown();

    } else {
      setIsLoading(false);
      startOtpCooldown();
      alert("Failed to send OTP. Please try again.");
    }
  };

  // Step 2: Submit OTP
  const handleSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();

    setIsVerified(true);
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setIsLoading(false);
      return;
    }

    const res = await dispatch(resetPassword({ email, resetToken: resetToken!, otp: otp, newPassword }));

    if (resetPassword.fulfilled.match(res)) {
      setIsLoading(false);
      setIsPasswordUpdated(true);

      setNewPassword("");
      setConfirmPassword("");

      sessionStorage.removeItem('lastOTPResend');

      setTimeout(() => {
        navigate(ROUTES.AUTH.SIGN_IN);
      }, 3000);

    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-8 lg:p-6">

          {/* STEP 1: EMAIL ENTRY */}
          {!isSubmitted && !isVerified && (
            <div className="animate-in fade-in duration-300">
              <header className="mb-2">
                <div className="h-12 w-12 rounded-xl bg-[#059669]/10 text-[#0f172a] flex items-center justify-center mb-4">
                  <KeyRound size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a]">Reset Password</h3>
                <p className="text-sm text-[#64748b] mt-1">Enter your email to receive a recovery code</p>
              </header>
              <form className="space-y-4" onSubmit={handleSubmitEmail}>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold ml-1 text-[#0f172a]">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                    <Input
                      required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#059669]/20"
                    />
                  </div>
                </div>
                <Button disabled={isLoading || !canResendOtp} className="w-full h-12 rounded-xl font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white">
                  {isLoading ? "Sending..." : "Send Reset OTP"}
                </Button>
                {!canResendOtp && (
                  <p className="w-full text-center text-sm text-[#64748b]">
                    Wait for <b>{timeLeft} seconds</b> to request OTP again.
                  </p>
                )}
              </form>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {isSubmitted && !isVerified && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <header className="mb-6">
                <div className="h-12 w-12 rounded-xl bg-[#059669]/10 text-[#0f172a] flex items-center justify-center mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a]">Input OTP</h3>
                <p className="text-sm text-[#64748b] mt-1">If your email exists, an OTP was sent.</p>
              </header>
              <form className="space-y-4" onSubmit={handleSubmitOtp}>
                <Input
                  maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-14 rounded-xl bg-[#f8fafc] border-[#e2e8f0] text-center text-2xl font-black tracking-[0.5em] focus-visible:ring-[#059669]/20"
                />
                <Button disabled={isLoading || otp.length < 6} className="w-full h-12 rounded-xl font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white">
                  Next
                </Button>
              </form>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {isVerified && (
            <div className="animate-in slide-in-from-right-4 duration-400">
              <header className="mb-6">
                <div className="h-12 w-12 rounded-xl bg-[#059669]/10 text-[#0f172a] flex items-center justify-center mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a]">New Password</h3>
                <p className="text-sm text-[#64748b] mt-1">Set a secure password for your account</p>
              </header>
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold ml-1">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-xl bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#059669]/20"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold ml-1">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-xl bg-[#f8fafc] border-[#e2e8f0] focus-visible:ring-[#059669]/20"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                </div>
                <Button disabled={isLoading || newPassword !== confirmPassword || !newPassword || isPasswordUpdated} className="w-full h-12 rounded-xl font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white">
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
                {isPasswordUpdated && (
                  <p className="w-full text-center text-sm text-[#64748b]">
                    Successfully updated Password! Redirecting to signin...
                  </p>
                )}
              </form>
            </div>
          )}

          <footer className="mt-10 text-center pt-2">
            <p className="text-sm text-[#64748b] font-medium">
              Remembered your password?{" "}
              <Link to={ROUTES.AUTH.SIGN_IN} className="text-[#0f172a] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
