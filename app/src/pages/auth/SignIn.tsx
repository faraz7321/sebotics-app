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
} from "lucide-react";

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

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
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
    const errors = {
      username: "",
      password: "",
    };

    if (!formData.username) {
      errors.username = "Username or email is required";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
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
      setError("Credentials required");
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
        setError(res.payload as string || "Login failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-8 lg:p-6">
          <header className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900">
              Welcome Back
            </h3>
          </header>

          <form className="space-y-5" onSubmit={handleSignIn}>
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

            {/* User */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold ml-1">
                Username or Email
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={18} />
                </span>
                <Input
                  id="username"
                  placeholder="john123 or john@example.com"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 ${formErrors.username ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="pass" className="text-sm font-semibold">Password</Label>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-bold text-primary hover:cursor-pointer"
                  type="button"
                  onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
                >
                  Forgot?
                </Button>
              </div>
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
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <footer className="mt-8 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
