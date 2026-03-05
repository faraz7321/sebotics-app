import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Lock, Eye, Mail,
  EyeOff, ArrowRight, AlertCircle,
  Languages,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch } from "@/store";
import { registerUser } from "@/lib/slices/AuthSlice";
import { ROUTES } from "@/config/routes";

export default function SignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    password?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    if (formErrors) {
      setFormErrors(prev => ({ ...prev, [id]: undefined }));
    }
    if (error) setError(null);
  };

  const validate = () => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
    } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = t('auth.errors.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      errors.lastName = t('auth.errors.lastNameRequired');
    }

    if (!formData.email.trim()) {
      errors.email = t('auth.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.username) {
      errors.username = t('auth.errors.usernameRequired');
    }

    if (!formData.password) {
      errors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('auth.errors.passwordMin');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await dispatch(registerUser(formData));
      if (registerUser.fulfilled.match(res)) {
        navigate(ROUTES.DASHBOARD.HOME);
      } else {
        setError(res.payload as string || t('auth.errors.registrationFailed'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.registrationFailed'));
    } finally {
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
          <header className="mb-8">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.signUp.title')}</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{t('auth.signUp.subtitle')}</p>
          </header>

          <form className="space-y-4" onSubmit={handleSignUp}>

            {error && (
              <Alert
                variant="destructive"
                className="rounded-2xl bg-destructive/5 border-none"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-bold text-slate-700 ml-1">{t('auth.signUp.firstNameLabel')}</Label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User size={18} strokeWidth={2.5} />
                  </span>
                  <Input
                    id="firstName"
                    placeholder={t('auth.signUp.firstNamePlaceholder')}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.firstName ? 'border-destructive ring-destructive/10' : ''}`}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-bold text-slate-700 ml-1">{t('auth.signUp.lastNameLabel')}</Label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User size={18} strokeWidth={2.5} />
                  </span>
                  <Input
                    id="lastName"
                    placeholder={t('auth.signUp.lastNamePlaceholder')}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.lastName ? 'border-destructive ring-destructive/10' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">{t('auth.signUp.emailLabel')}</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.signUp.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.email ? 'border-destructive ring-destructive/10' : ''}`}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold text-slate-700 ml-1">{t('auth.signUp.usernameLabel')}</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </span>
                <Input
                  id="username"
                  placeholder={t('auth.signUp.usernamePlaceholder')}
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.username ? 'border-destructive ring-destructive/10' : ''}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">{t('auth.signUp.passwordLabel')}</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"><Lock size={18} strokeWidth={2.5} /></span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`pl-12 pr-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.password ? 'border-destructive ring-destructive/10' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:bg-transparent hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </Button>
              </div>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-12 rounded-2xl text-md font-bold shadow-lg shadow-primary/20 mt-6 active:scale-[0.98] transition-all"
            >
              {isLoading ? t('auth.signUp.creatingAccount') : <>{t('auth.signUp.submit')} <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>

          <footer className="mt-8 text-center text-slate-500 font-bold">
            <p className="text-sm font-bold">
              {t('auth.signUp.alreadyHaveAccount')} <Link to={ROUTES.AUTH.SIGN_IN} className="text-primary hover:text-primary/80 transition-colors ml-1">{t('auth.signUp.signInLink')}</Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
