import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Lock,
  EyeOff,
  Eye,
  ArrowRight,
  User,
  Languages,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store";
import { loginUser } from "@/lib/slices/AuthSlice";
import { ROUTES } from "@/config/routes";
import { robotStateSocket, taskStateSocket } from "@/lib/ws/stateSockets";

export default function SignIn() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({
    username: "",
    password: "",
  });

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
    const errors: { username?: string; password?: string } = {
      username: "",
      password: "",
    };

    if (!formData.username) {
      errors.username = t('auth.errors.usernameRequired');
    }

    if (!formData.password) {
      errors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('auth.errors.passwordMin');
    }

    setFormErrors(errors);
    return !errors.username && !errors.password;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    if (!formData.username || !formData.password) {
      setError(t('auth.errors.credentialsRequired'));
      setIsLoading(false);
      return;
    }

    try {
      const res = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(res)) {
        robotStateSocket.connect();
        taskStateSocket.connect();

        navigate(ROUTES.DASHBOARD.HOME);
      } else {
        setError(res.payload as string || t('auth.errors.loginFailed'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
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
          <header className="mb-10">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('auth.signIn.title')}
            </h3>
          </header>

          <form className="space-y-6" onSubmit={handleSignIn}>
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

            {/* User */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold text-slate-700 ml-1">
                {t('auth.signIn.usernameLabel')}
              </Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={20} strokeWidth={2.5} />
                </span>
                <Input
                  id="username"
                  placeholder={t('auth.signIn.usernamePlaceholder')}
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all ${formErrors.username ? 'border-destructive ring-destructive/10' : ''}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">{t('auth.signIn.passwordLabel')}</Label>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 hover:cursor-pointer hover:no-underline"
                  type="button"
                  onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
                >
                  {t('auth.signIn.forgotPassword')}
                </Button>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"><Lock size={20} strokeWidth={2.5} /></span>
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
                  {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </Button>
              </div>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-12 hover:cursor-pointer rounded-2xl text-md font-bold shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                t('auth.signIn.signingIn')
              ) : (
                <>
                  {t('auth.signIn.submit')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <footer className="mt-10 text-center">
            <p className="text-sm text-slate-500 font-bold">
              {t('auth.signIn.noAccount')}{" "}
              <Link
                to={ROUTES.AUTH.SIGN_UP}
                className="text-primary hover:text-primary/80 transition-colors ml-1"
              >
                {t('auth.signIn.signUpLink')}
              </Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
