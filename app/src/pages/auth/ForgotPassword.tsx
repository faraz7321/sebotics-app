import React, { useEffect, useState } from 'react';
import { Mail, KeyRound, ShieldCheck, Lock, Eye, EyeOff, Languages } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from '@/config/routes';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, resetPassword } from '@/lib/slices/AuthSlice';

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const resetToken = useAppSelector(s => s.auth.resetToken);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);

  useEffect(() => {
    const lastResendTime = sessionStorage.getItem('lastOTPResend');
    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime);
      const remainingTime = Math.max(0, 60000 - timeSinceLastResend);

      if (remainingTime > 0) {
        setTimeLeft(Math.ceil(remainingTime / 1000));
        setCanResendOtp(false);
      } else {
        sessionStorage.removeItem('lastOTPResend');
      }
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
    } else if (!canResendOtp) {
      setCanResendOtp(true);
      sessionStorage.removeItem('lastOTPResend');
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, canResendOtp]);

  function validatePassword(password: string) {
    if (!password) return t('auth.errors.passwordRequired');
    if (password.length < 8) return t('auth.errors.passwordMin');
    return null;
  }

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(res)) {
      setIsLoading(false);
      setIsSubmitted(true);
      sessionStorage.setItem('lastOTPResend', Date.now().toString());
      setTimeLeft(60);
      setCanResendOtp(false);
    } else {
      setIsLoading(false);
      sessionStorage.setItem('lastOTPResend', Date.now().toString());
      setTimeLeft(60);
      setCanResendOtp(false);
      alert(t('auth.errors.otpFail'));
    }
  };

  const handleSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerified(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
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

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('de') ? 'en' : 'de';
    void i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 relative">
      {/* Language Toggle */}
      <div className="absolute top-8 right-8 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 px-3 h-10 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all font-semibold"
        >
          <Languages className="h-4 w-4" />
          <span>{i18n.language.startsWith('de') ? 'Deutsch' : 'English'}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 uppercase">
            {i18n.language.startsWith('de') ? 'DE' : 'EN'}
          </span>
        </Button>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-8 lg:p-10">

          {/* STEP 1: EMAIL ENTRY */}
          {!isSubmitted && !isVerified && (
            <div className="animate-in fade-in duration-300">
              <header className="mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <KeyRound size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.forgotPassword.title')}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{t('auth.forgotPassword.subtitle')}</p>
              </header>
              <form className="space-y-6" onSubmit={handleSubmitEmail}>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 ml-1">{t('auth.forgotPassword.emailLabel')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} strokeWidth={2.5} />
                    <Input
                      required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
                <Button disabled={isLoading || !canResendOtp} className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all bg-slate-900 hover:bg-slate-800">
                  {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendCode')}
                </Button>
                {!canResendOtp && (
                  <p className="w-full text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {t('auth.forgotPassword.waitPrefix')} {timeLeft} {t('auth.forgotPassword.waitSuffix')}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {isSubmitted && !isVerified && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <header className="mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.forgotPassword.otpTitle')}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{t('auth.forgotPassword.otpSubtitle')}</p>
              </header>
              <form className="space-y-6" onSubmit={handleSubmitOtp}>
                <Input
                  maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-16 rounded-2xl bg-slate-50 border-slate-100 text-center text-3xl font-black tracking-[0.5em] focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <Button disabled={isLoading || otp.length < 6} className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all bg-slate-900 hover:bg-slate-800">
                  {t('auth.forgotPassword.verify')}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {isVerified && (
            <div className="animate-in slide-in-from-right-4 duration-400">
              <header className="mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Lock size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.forgotPassword.newPasswordTitle')}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{t('auth.forgotPassword.newPasswordSubtitle')}</p>
              </header>
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 ml-1">{t('auth.forgotPassword.passwordLabel')}</Label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? "text" : "password"} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 ml-1">{t('auth.forgotPassword.confirmPasswordLabel')}</Label>
                    <div className="relative group">
                      <Input
                        type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        {showConfirmPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button disabled={isLoading || newPassword !== confirmPassword || !newPassword || isPasswordUpdated} className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all bg-slate-900 hover:bg-slate-800 mt-4">
                  {isLoading ? t('auth.forgotPassword.updating') : t('auth.forgotPassword.submit')}
                </Button>
                {isPasswordUpdated && (
                  <p className="w-full text-center text-sm text-emerald-600 font-bold mt-4">
                    {t('auth.forgotPassword.success')}
                  </p>
                )}
              </form>
            </div>
          )}

          <footer className="mt-10 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-bold">
              {t('auth.forgotPassword.backPrompt')}{" "}
              <Link to={ROUTES.AUTH.SIGN_IN} className="text-primary hover:text-primary/80 transition-colors ml-1">
                {t('auth.forgotPassword.backToSignIn')}
              </Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}