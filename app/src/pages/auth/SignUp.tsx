import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Lock, Eye, Mail,
  EyeOff, ArrowRight, AlertCircle,
} from "lucide-react";

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

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Clear specific field error when user types
    if (formErrors) {
      setFormErrors(prev => ({ ...prev, [id]: undefined }));
    }
    if (error) setError(null);
  };

  const validate = () => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    };

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length > 10) {
      errors.firstName = "First name must be at most 10 characters";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length > 10) {
      errors.lastName = "Last name must be at most 10 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email.trim())) {
      errors.email = "Enter a valid email";
    }

    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length > 8) {
      errors.username = "Username must be at most 8 characters";
    } else if (!/^[A-Za-z0-9]+$/.test(formData.username)) {
      errors.username = "Username must contain only letters and numbers";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setFormErrors(errors);
    return !errors.firstName && !errors.lastName && !errors.email && !errors.username && !errors.password;
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
        setError(res.payload as string || "Registeration failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-8 lg:p-6">
          <header className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Create Account</h3>
          </header>

          <form className="space-y-5" onSubmit={handleSignUp}>

            {error && (
              <Alert
                variant="destructive"
                className="rounded-2xl bg-destructive/5 border-none"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold ml-1">First Name</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={18} />
                </span>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.firstName ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold ml-1">Last Name</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={18} />
                </span>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.lastName ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">Email</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail size={18} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.email ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold ml-1">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={18} />
                </span>
                <Input
                  id="username"
                  placeholder="john123"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.username ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold ml-1">Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock size={18} /></span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.password ? 'border-destructive' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-md font-bold shadow-lg mt-6 active:scale-[0.98] transition-transform"
            >
              {isLoading ? "Creating Account..." : <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>

          <footer className="mt-8 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
