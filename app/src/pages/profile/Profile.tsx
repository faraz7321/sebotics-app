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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { changePassword } from "@/lib/slices/AuthSlice";
import { Loader } from "@/components/ui/loader";
import { listBusinesses } from "@/lib/slices/BusinessSlice";
import type { Business } from "@/lib/types/BusinessTypes";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

export default function Profile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
    return "Failed to update password";
  };

  const formatBusinessCreatedTime = (value: string): string => {
    const createdAt = Number(value);
    if (!Number.isFinite(createdAt)) {
      return value;
    }
    return new Date(createdAt).toLocaleString();
  };

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
    if (passwordData.currentPassword.length < 8) {
      setError("Current password must be at least 8 characters long");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
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
        setError(getErrorText(result.payload));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
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
        Loading profile...
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
            className="hover:cursor-pointer text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl"
            onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Centered Profile Content */}
        <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Profile</h1>
              <p className="text-slate-500 font-medium">Manage your account information and security settings.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 self-start md:self-center">
              <BadgeCheck size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{user.role}</span>
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

              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
                    <Building2 className="h-4 w-4" />
                    Businesses ({businesses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isBusinessesLoading ? (
                    <p className="text-sm text-slate-500">Loading businesses...</p>
                  ) : businessesError ? (
                    <p className="text-sm text-red-500">{businessesError}</p>
                  ) : businesses.length === 0 ? (
                    <p className="text-sm text-slate-500">No businesses assigned.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {businesses.map((business) => (
                        <button
                          key={business.id}
                          type="button"
                          onClick={() => setSelectedBusiness(business)}
                          className="w-full text-left rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors hover:cursor-pointer"
                        >
                          <p className="text-sm font-semibold text-slate-900">{business.name}</p>
                          <p className="text-xs text-slate-500">{business.address || "No address"}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Change Password Card */}
            <div className="lg:col-span-2">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-4 pt-8 px-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
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
                      <Label htmlFor="currentPassword" className="text-slate-700 font-semibold ml-1">Current Password</Label>
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
                        <Label htmlFor="newPassword" className="text-slate-700 font-semibold ml-1">New Password</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={18} />
                          </span>
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Min. 8 characters"
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
                        <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold ml-1">Confirm New Password</Label>
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
          <Dialog
            open={Boolean(selectedBusiness)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedBusiness(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedBusiness?.name || "Business details"}</DialogTitle>
                <DialogDescription>
                  Business information visible to this user.
                </DialogDescription>
              </DialogHeader>
              {selectedBusiness && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Address:</span>{" "}
                    {selectedBusiness.address || "No address"}
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>{" "}
                    {selectedBusiness.type || "N/A"}
                  </div>
                  <div>
                    <span className="text-slate-500">Business ID:</span>{" "}
                    <span className="break-all">{selectedBusiness.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Building ID:</span>{" "}
                    <span className="break-all">{selectedBusiness.buildingId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Customer ID:</span>{" "}
                    <span className="break-all">{selectedBusiness.customerId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>{" "}
                    {formatBusinessCreatedTime(selectedBusiness.createdTime)}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedBusiness(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
