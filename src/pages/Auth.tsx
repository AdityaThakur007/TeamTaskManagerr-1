import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckSquare, Loader2, ShieldCheck, Users, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);
const nameSchema = z.string().trim().min(1).max(100);

export default function Auth() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read role from URL: /auth?role=Admin or /auth?role=Member
  const roleParam = searchParams.get("role") as "Admin" | "Member" | null;
  const role: "Admin" | "Member" = roleParam === "Admin" ? "Admin" : "Member";

  const [busy, setBusy] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    document.title = `${role} Sign In — Taskify`;
  }, [role]);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const isAdmin = role === "Admin";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch {
      toast.error("Enter a valid email and password (6+ chars).");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      // Verify the user has the correct role
      if (data.role !== role) {
        toast.error(`This account is registered as ${data.role}. Please use the ${data.role} portal.`);
        setBusy(false);
        return;
      }
      login(data);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    try {
      nameSchema.parse(name);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch {
      toast.error("Please fill in all fields correctly.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email: signupEmail, password: signupPassword, role }),
      });
      login(data);
      toast.success(`${role} account created successfully! 🎉`);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  const accentClass = isAdmin
    ? "gradient-primary"
    : "bg-gradient-to-br from-info to-sky-400";

  const accentTextClass = isAdmin ? "text-primary" : "text-info";
  const accentBgClass = isAdmin ? "bg-primary/10" : "bg-info/10";
  const accentBorderClass = isAdmin ? "border-primary/30" : "border-info/30";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 gradient-subtle">

      {/* ── Left Panel ── */}
      <div className={`hidden lg:flex flex-col justify-between p-12 ${accentClass} text-white relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Taskify</span>
        </div>

        {/* Main content */}
        <div className="space-y-6 max-w-md relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
            {isAdmin
              ? <ShieldCheck className="h-10 w-10" />
              : <Users className="h-10 w-10" />}
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1 backdrop-blur">
            {role} Portal
          </Badge>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {isAdmin
              ? "Take full control of your workspace."
              : "Focus on what matters — your tasks."}
          </h2>
          <p className="text-white/80 text-lg">
            {isAdmin
              ? "Manage projects, assign tasks, track team progress, and make data-driven decisions."
              : "View your assigned tasks, update statuses, and stay on top of your personal progress."}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(isAdmin
              ? ["Create Projects", "Assign Tasks", "Manage Team", "View Reports", "Full Dashboard"]
              : ["View Tasks", "Update Status", "Track Progress", "Kanban Board", "Team View"]
            ).map((feat) => (
              <span key={feat} className="text-xs bg-white/15 border border-white/20 rounded-full px-3 py-1 backdrop-blur">
                {feat}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/60 relative z-10">© {new Date().getFullYear()} Taskify</p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col items-center justify-center p-6 gap-6">

        {/* Back to portal */}
        <div className="w-full max-w-md">
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to portal
          </Link>
        </div>

        {/* Role indicator pill */}
        <div className={`flex items-center gap-2 rounded-full border ${accentBorderClass} ${accentBgClass} px-4 py-2`}>
          {isAdmin
            ? <ShieldCheck className={`h-4 w-4 ${accentTextClass}`} />
            : <Users className={`h-4 w-4 ${accentTextClass}`} />}
          <span className={`text-sm font-semibold ${accentTextClass}`}>{role} Portal</span>
        </div>

        <Card className="w-full max-w-md shadow-elegant border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              {isAdmin ? "Admin Access" : "Member Access"}
            </CardTitle>
            <CardDescription>
              Sign in or create a <strong>{role}</strong> account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              {/* ── Sign In ── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="li-email">Email</Label>
                    <Input
                      id="li-email"
                      type="email"
                      placeholder="you@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="li-password">Password</Label>
                    <Input
                      id="li-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <Button
                    type="submit"
                    className={`w-full h-10 text-white ${accentClass}`}
                    disabled={busy}
                  >
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign in as {role}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Wrong portal?{" "}
                    <Link
                      to={`/auth?role=${isAdmin ? "Member" : "Admin"}`}
                      className={`${accentTextClass} font-medium hover:underline`}
                    >
                      Switch to {isAdmin ? "Member" : "Admin"} portal
                    </Link>
                  </p>
                </form>
              </TabsContent>

              {/* ── Sign Up ── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input
                      id="su-name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email">Email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="you@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password">Password</Label>
                    <Input
                      id="su-password"
                      type="password"
                      placeholder="Min 6 characters"
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>

                  {/* Role display */}
                  <div className={`flex items-center gap-2 rounded-lg border ${accentBorderClass} ${accentBgClass} p-3`}>
                    {isAdmin
                      ? <ShieldCheck className={`h-4 w-4 ${accentTextClass} shrink-0`} />
                      : <Users className={`h-4 w-4 ${accentTextClass} shrink-0`} />}
                    <div>
                      <p className={`text-xs font-semibold ${accentTextClass}`}>Registering as: {role}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin
                          ? "You'll have full access to manage the workspace."
                          : "You'll be able to view and update your tasks."}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-10 text-white ${accentClass}`}
                    disabled={busy}
                  >
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create {role} Account
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Wrong portal?{" "}
                    <Link
                      to={`/auth?role=${isAdmin ? "Member" : "Admin"}`}
                      className={`${accentTextClass} font-medium hover:underline`}
                    >
                      Switch to {isAdmin ? "Member" : "Admin"} portal
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}