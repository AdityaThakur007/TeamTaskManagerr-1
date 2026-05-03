import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  ShieldCheck, Users, CheckSquare, ArrowRight,
  LayoutDashboard, FolderKanban, ListTodo, BarChart3,
  Lock, Star, Zap, Globe,
} from "lucide-react";

const ADMIN_FEATURES = [
  { icon: LayoutDashboard, text: "Full dashboard analytics" },
  { icon: FolderKanban, text: "Create & manage projects" },
  { icon: ListTodo, text: "Assign tasks to members" },
  { icon: Users, text: "Manage team members" },
  { icon: BarChart3, text: "View all reports" },
  { icon: Lock, text: "Delete projects & tasks" },
];

const MEMBER_FEATURES = [
  { icon: ListTodo, text: "View assigned tasks" },
  { icon: CheckSquare, text: "Update task status" },
  { icon: FolderKanban, text: "View joined projects" },
  { icon: BarChart3, text: "Personal dashboard" },
  { icon: Users, text: "See team members" },
  { icon: Star, text: "Track your progress" },
];

const STATS = [
  { icon: Globe, value: "100%", label: "Open Source" },
  { icon: Zap, value: "< 1s", label: "Load Time" },
  { icon: Lock, value: "JWT", label: "Secured" },
  { icon: Star, value: "MERN", label: "Tech Stack" },
];

export default function Portal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Welcome — Taskify";
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* ── Animated background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-primary/6 blur-3xl animate-pulse delay-500" />
      </div>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Taskify</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Already have an account?</span>
          <button
            onClick={() => navigate("/auth?role=member")}
            className="text-primary font-semibold hover:underline"
          >
            Sign in →
          </button>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">

        {/* ── Hero ── */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Zap className="h-3.5 w-3.5" /> Team Task Manager — Built on MERN Stack
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Portal
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Taskify gives Admins full control and Members focused task access. Select your role to get started.
          </p>
        </div>

        {/* ── Portal Cards ── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">

          {/* Admin Card */}
          <div
            onClick={() => navigate("/auth?role=Admin")}
            className="group relative cursor-pointer rounded-3xl overflow-hidden border border-primary/20 hover:border-primary/60 transition-all duration-300 hover:shadow-glow hover:-translate-y-2"
          >
            {/* Gradient top band */}
            <div className="h-2 gradient-primary w-full" />

            <div className="p-8 bg-card">
              {/* Icon */}
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>

              {/* Label */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                <Lock className="h-3 w-3" /> Admin Access
              </div>

              <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Full control over projects, tasks, and your entire team workspace.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8">
                {ADMIN_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <f.icon className="h-3 w-3 text-primary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className="w-full gradient-primary text-white font-semibold py-3 px-6 rounded-xl shadow-glow flex items-center justify-center gap-2 group-hover:opacity-90 transition-opacity">
                Enter as Admin <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Member Card */}
          <div
            onClick={() => navigate("/auth?role=Member")}
            className="group relative cursor-pointer rounded-3xl overflow-hidden border border-border hover:border-info/50 transition-all duration-300 hover:shadow-[0_10px_40px_-10px_hsl(199_89%_48%/0.3)] hover:-translate-y-2"
          >
            {/* Colored top band */}
            <div className="h-2 bg-gradient-to-r from-info to-sky-400 w-full" />

            <div className="p-8 bg-card">
              {/* Icon */}
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-info to-sky-400 flex items-center justify-center shadow-[0_4px_20px_hsl(199_89%_48%/0.35)] mb-5 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>

              {/* Label */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info mb-3">
                <Users className="h-3 w-3" /> Member Access
              </div>

              <h2 className="text-2xl font-bold mb-2">Member Portal</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Stay focused on your assigned tasks and track your personal progress.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8">
                {MEMBER_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                      <f.icon className="h-3 w-3 text-info" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className="w-full bg-gradient-to-r from-info to-sky-400 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_hsl(199_89%_48%/0.3)] group-hover:opacity-90 transition-opacity">
                Enter as Member <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Taskify · Built with MongoDB, Express, React & Node.js
        </p>
      </main>
    </div>
  );
}
