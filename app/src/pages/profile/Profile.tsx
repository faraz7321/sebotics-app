import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Shield,
  BadgeCheck,
  Building2,
  Languages,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store";
import { changePassword } from "@/lib/slices/AuthSlice";
import { Loader } from "@/components/ui/loader";
import { listBusinesses } from "@/lib/slices/BusinessSlice";
import type { Business } from "@/lib/types/BusinessTypes";
import { BusinessDetailModal } from "@/components/business/BusinessDetailModal";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

export default function Profile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useAppSelector((state) => state.user.user);
  const isUserLoading = useAppSelector((state) => state.user.loading);
  const businesses = useAppSelector((state) => state.business.businesses);
  const isBusinessesLoading = useAppSelector((state) => state.business.loading);
  const hasLoadedBusinesses = useAppSelector((state) => state.business.hasLoaded);
  const businessesError = useAppSelector((state) => state.business.error);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (businesses.length === 0 && !isBusinessesLoading && !hasLoadedBusinesses) {
      void dispatch(listBusinesses());
    }
  }, [businesses.length, isBusinessesLoading, hasLoadedBusinesses, dispatch]);

  const getErrorText = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "string") {
      return value;
    }
    return t('settings.security.failUpdate');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [id]: value }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validate = () => {
    if (!passwordData.currentPassword) {
      setError(t('settings.security.validation.currentRequired'));
      return false;
    }
    if (passwordData.currentPassword.length < 8) {
      setError(t('settings.security.validation.currentMin'));
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setError(t('settings.security.validation.newMin'));
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('settings.security.validation.match'));
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      );

      if (changePassword.fulfilled.match(result)) {
        setSuccess(true);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(getErrorText(result.payload));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('settings.security.validation.genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    if (isUserLoading) {
      return <Loader variant="fullscreen" />;
    }

    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        {t('profile.loading')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-[1600px] mx-auto relative px-4 md:px-10">
        {/* Fixed/Side Back Button */}
        <div className="pt-6 md:pt-10 flex justify-start">
          <Button
            variant="ghost"
            className="hover:cursor-pointer text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl font-bold"
            onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.back')}
          </Button>
        </div>

        {/* Centered Profile Content */}
        <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('profile.title')}</h1>
              <p className="text-slate-500 font-medium">{t('profile.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 self-start md:self-center">
              <BadgeCheck size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{user.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Details Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                <div className="h-24 bg-gradient-to-r from-primary/80 to-primary" />
                <CardContent className="relative pt-12 pb-8 px-6">
                  <div className="absolute -top-12 left-6 h-24 w-24 rounded-3xl bg-white p-1.5 shadow-xl">
                    <div className="h-full w-full rounded-2xl bg-slate-100 flex items-center justify-center text-primary">
                      <User size={40} strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-slate-500 font-bold">@{user.username}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Mail size={16} />
                        </div>
                        <span className="text-sm font-semibold truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Shield size={16} />
                        </div>
                        <span className="text-sm font-semibold">{user.role === 'ADMIN' ? t('profile.admin') : t('profile.client')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                    <Building2 className="h-4 w-4" />
                    {t('profile.businesses')} ({businesses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isBusinessesLoading ? (
                    <p className="text-sm text-slate-500 font-medium">{t('profile.loadingBusinesses')}</p>
                  ) : businessesError ? (
                    <p className="text-sm text-red-500 font-medium">{businessesError}</p>
                  ) : businesses.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium">{t('profile.noBusinesses')}</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {businesses.map((business) => (
                        <button
                          key={business.id}
                          type="button"
                          onClick={() => setSelectedBusiness(business)}
                          className="w-full text-left rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors hover:cursor-pointer group"
                        >
                          <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{business.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{business.address || t('common.noAddress')}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Language Settings Card */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-4 pt-8 px-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                      <Languages size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{t('settings.language.label')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.language.description')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => i18n.changeLanguage('en')}
                      className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all hover:cursor-pointer ${(i18n.language === 'en' || i18n.language.startsWith('en-'))
                        ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${(i18n.language === 'en' || i18n.language.startsWith('en-')) ? 'bg-primary text-white' : 'bg-white border border-slate-200'
                          }`}>
                          🇺🇸
                        </div>
                        <span className="font-black tracking-tight">{t('settings.language.en')}</span>
                      </div>
                      {(i18n.language === 'en' || i18n.language.startsWith('en-')) && (
                        <CheckCircle2 size={24} className="text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => i18n.changeLanguage('de')}
                      className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all hover:cursor-pointer ${(i18n.language === 'de' || i18n.language.startsWith('de-'))
                        ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${(i18n.language === 'de' || i18n.language.startsWith('de-')) ? 'bg-primary text-white' : 'bg-white border border-slate-200'
                          }`}>
                          🇩🇪
                        </div>
                        <span className="font-black tracking-tight">{t('settings.language.de')}</span>
                      </div>
                      {(i18n.language === 'de' || i18n.language.startsWith('de-')) && (
                        <CheckCircle2 size={24} className="text-primary" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password Card */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-4 pt-8 px-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shadow-inner">
                      <KeyRound size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{t('settings.security.title')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.security.description')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    {success && (
                      <Alert className="rounded-2xl bg-emerald-50 border-none text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertDescription className="font-bold text-sm">
                          {t('settings.security.success')}
                        </AlertDescription>
                      </Alert>
                    )}

                    {error && (
                      <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-none">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-bold text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-slate-700 font-black uppercase tracking-widest text-[10px] ml-1">{t('settings.security.currentPassword')}</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={18} />
                        </span>
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handleInputChange}
                          placeholder={t('settings.security.currentPassword')}
                          className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-slate-700 font-black uppercase tracking-widest text-[10px] ml-1">{t('settings.security.newPassword')}</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={18} />
                          </span>
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={handleInputChange}
                            placeholder={t('settings.security.newPasswordPlaceholder')}
                            className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-700 font-black uppercase tracking-widest text-[10px] ml-1">{t('settings.security.confirmPassword')}</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <ShieldCheck size={18} />
                          </span>
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder={t('settings.security.confirmPasswordPlaceholder')}
                            className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-w-[200px]"
                      >
                        {isLoading ? t('settings.security.updating') : (
                          <>
                            {t('settings.security.updateButton')}
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
          <BusinessDetailModal
            business={selectedBusiness}
            onClose={() => setSelectedBusiness(null)}
          />
        </div>
      </div>
    </div>
  );
}
