import { useState } from "react";
import {
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store";
import { changePassword } from "@/lib/slices/AuthSlice";

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [id]: value }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validate = () => {
    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
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
        setError(result.payload as string || "Failed to update password");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account information and security settings.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 self-start">
          <BadgeCheck size={20} />
          <span className="text-sm font-semibold uppercase tracking-wider">{user.role}</span>
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
                  <p className="text-sm text-slate-500 font-medium">@{user.username}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Shield size={16} />
                    </div>
                    <span className="text-sm font-medium">{user.role === 'ADMIN' ? 'Administrator' : 'Client Access'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="rounded-2xl border-none bg-blue-50 text-blue-700">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs font-medium leading-relaxed">
              Your account is secured with role-based access control.
            </AlertDescription>
          </Alert>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-8 px-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Security Settings</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleChangePassword} className="space-y-6">
                {success && (
                  <Alert className="rounded-2xl bg-emerald-50 border-none text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="font-medium text-sm">
                      Password updated successfully
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="rounded-2xl bg-destructive/5 border-none">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword text-slate-700 font-semibold ml-1">Current Password</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </span>
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                      className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword text-slate-700 font-semibold ml-1">New Password</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={18} />
                      </span>
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Min. 6 characters"
                        className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword text-slate-700 font-semibold ml-1">Confirm New Password</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <ShieldCheck size={18} />
                      </span>
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repeat new password"
                        className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all min-w-[160px]"
                  >
                    {isLoading ? (
                      "Updating..."
                    ) : (
                      <>
                        Update Password
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
    </div>
  );
}