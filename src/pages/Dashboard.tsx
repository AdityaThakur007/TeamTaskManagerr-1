import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, ListTodo, CheckCircle2, AlertCircle, Clock, TrendingUp,
  FolderKanban, Zap, Target, Activity, MessageSquare, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, RadialBarChart, RadialBar,
} from "recharts";

const COLORS = {
  primary: "hsl(246 80% 60%)",
  success: "hsl(142 71% 45%)",
  warning: "hsl(38 92% 50%)",
  info: "hsl(199 89% 48%)",
  danger: "hsl(0 84% 60%)",
  purple: "hsl(271 91% 65%)",
};

const STATUS_COLOR: Record<string, string> = {
  Completed: "text-success",
  "On Track": "text-info",
  "At Risk": "text-warning",
  Planning: "text-muted-foreground",
};

const STATUS_BG: Record<string, string> = {
  Completed: "bg-success/10 text-success border-success/20",
  "On Track": "bg-info/10 text-info border-info/20",
  "At Risk": "bg-warning/10 text-warning border-warning/20",
  Planning: "bg-muted text-muted-foreground border-muted-foreground/20",
};

// Fake activity feed items (we don't have real activity log yet)
const ACTIVITY_ITEMS = [
  { icon: "✅", text: "Task marked as Done", time: "2 min ago", color: "text-success" },
  { icon: "📁", text: "New project created", time: "15 min ago", color: "text-primary" },
  { icon: "👤", text: "Team member added", time: "1 hr ago", color: "text-info" },
  { icon: "⚠️", text: "Task overdue flagged", time: "3 hrs ago", color: "text-warning" },
  { icon: "💬", text: "Comment on task", time: "5 hrs ago", color: "text-purple-500" },
];

const TEAM_PERFORMANCE = [
  { name: "Productivity", value: 82, fill: COLORS.primary },
  { name: "Engagement", value: 74, fill: COLORS.info },
  { name: "Quality", value: 91, fill: COLORS.success },
];

// Calendar helper
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [calMonth] = useState(today.getMonth());
  const [calYear] = useState(today.getFullYear());

  useEffect(() => {
    document.title = "Dashboard — Taskify";
    apiFetch("/dashboard")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  const {
    totalTasks = 0, completedTasks = 0, pendingTasks = 0,
    inProgressTasks = 0, overdueTasks = 0, totalProjects = 0,
    totalMembers = 0, completionRate = 0, activityRate = 0,
    monthlyTrend = [], projectProgress = [],
  } = stats || {};

  const pieData = [
    { name: "Completed", value: completedTasks, fill: COLORS.success },
    { name: "In Progress", value: inProgressTasks, fill: COLORS.info },
    { name: "Pending", value: pendingTasks, fill: COLORS.warning },
    { name: "Overdue", value: overdueTasks, fill: COLORS.danger },
  ].filter(d => d.value > 0);

  const radialData = [{ name: "Completion", value: completionRate, fill: COLORS.primary }];

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span> ·{" "}
            <Badge variant="secondary" className="capitalize">{role}</Badge>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* ─── TOP STAT CARDS ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <TopCard icon={Users} label="Team Members" value={totalMembers} sub="Active users" color="bg-primary/10 text-primary" trend="+2 this month" />
        <TopCard icon={ListTodo} label="Active Tasks" value={inProgressTasks + pendingTasks} sub={`${totalTasks} total`} color="bg-info/10 text-info" trend={`${activityRate}% activity`} />
        <TopCard icon={TrendingUp} label="Team Activity" value={`${activityRate}%`} sub="Completion rate" color="bg-success/10 text-success" trend={`${completedTasks} done`} />
        <TopCard icon={MessageSquare} label="Overdue Tasks" value={overdueTasks} sub="Need attention" color="bg-destructive/10 text-destructive" trend="Action needed" />
      </div>

      {/* ─── ROW 2: PIE + LINE CHART ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pie Chart */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Status Breakdown</CardTitle>
            <CardDescription>Task distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {totalTasks === 0 ? (
              <EmptyChart message="No tasks yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Tasks"]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Trend Analysis</CardTitle>
            <CardDescription>Tasks created vs completed over 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="created" name="Created" stroke={COLORS.info} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke={COLORS.success} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 3: CIRCULAR + TASK INSIGHTS + TEAM PERFORMANCE ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Circular Completion */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Completion</CardTitle>
            <CardDescription>Overall completion rate</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "hsl(var(--muted))" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold">{completionRate}%</span>
              <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
            </div>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Insights</CardTitle>
            <CardDescription>Status summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {[
              { label: "Done", value: completedTasks, total: totalTasks, color: "bg-success" },
              { label: "In Progress", value: inProgressTasks, total: totalTasks, color: "bg-info" },
              { label: "Pending", value: pendingTasks, total: totalTasks, color: "bg-warning" },
              { label: "Overdue", value: overdueTasks, total: totalTasks, color: "bg-destructive" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.color}`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {totalTasks === 0 && <p className="text-xs text-center text-muted-foreground py-4">No tasks yet</p>}
          </CardContent>
        </Card>

        {/* Team Performance Bar */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team Analytics</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEAM_PERFORMANCE} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {TEAM_PERFORMANCE.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 4: PROJECT PROGRESS + CALENDAR + ACTIVITY FEED ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Project Progress */}
        <Card className="shadow-elegant lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Project Status</CardTitle>
            <CardDescription>Progress for each project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectProgress.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No projects yet</p>}
            {projectProgress.map((p: any) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium truncate max-w-[140px]">{p.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_BG[p.status]}`}>{p.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.progress}%`,
                        background: p.status === "Completed" ? COLORS.success : p.status === "On Track" ? COLORS.info : p.status === "At Risk" ? COLORS.warning : COLORS.purple,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8 text-right">{p.progress}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.done}/{p.total} tasks · {p.members} members</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}
            </CardTitle>
            <CardDescription>Monthly calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
              {calDays.map((day, i) => (
                <div
                  key={i}
                  className={`text-xs py-1.5 rounded-lg transition-colors
                    ${day === null ? "" : "hover:bg-accent cursor-pointer"}
                    ${day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
                      ? "gradient-primary text-white font-bold shadow-glow"
                      : day ? "text-foreground" : ""
                    }`}
                >
                  {day || ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />Activity Feed
            </CardTitle>
            <CardDescription>Recent actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ACTIVITY_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── ROW 5: GOALS TRACKER + PROJECT TIMELINE ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Goals Tracker */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />Goals Tracker
            </CardTitle>
            <CardDescription>Sprint targets this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Task Completion Rate", target: 90, current: completionRate, color: COLORS.primary },
              { label: "On-Time Delivery", target: 85, current: Math.max(0, 85 - overdueTasks * 10), color: COLORS.success },
              { label: "Team Activity", target: 80, current: activityRate, color: COLORS.info },
              { label: "Projects On Track", target: 100, current: projectProgress.length > 0 ? Math.round((projectProgress.filter((p: any) => p.status === "On Track" || p.status === "Completed").length / projectProgress.length) * 100) : 0, color: COLORS.warning },
            ].map((goal) => (
              <div key={goal.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-muted-foreground">{goal.current}% / {goal.target}%</span>
                </div>
                <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goal.current, 100)}%`, background: goal.color }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/30" style={{ left: `${goal.target}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Progress Timeline */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />Project Progress Tracker
            </CardTitle>
            <CardDescription>Phase-by-phase milestone view</CardDescription>
          </CardHeader>
          <CardContent>
            {["Planning", "Design", "Development", "Testing", "Launch"].map((phase, i, arr) => {
              const totalPhases = arr.length;
              const donePhases = totalProjects > 0 ? Math.min(Math.floor((completionRate / 100) * totalPhases), totalPhases) : 0;
              const isCompleted = i < donePhases;
              const isCurrent = i === donePhases;
              return (
                <div key={phase} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                    ${isCompleted ? "gradient-primary text-white shadow-glow" : isCurrent ? "border-2 border-primary text-primary bg-accent" : "bg-muted text-muted-foreground"}`}>
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isCurrent ? "text-primary" : isCompleted ? "" : "text-muted-foreground"}`}>{phase}</span>
                      <Badge variant="outline" className={`text-[10px] ${isCompleted ? "bg-success/10 text-success" : isCurrent ? "bg-primary/10 text-primary" : ""}`}>
                        {isCompleted ? "Done" : isCurrent ? "In Progress" : "Pending"}
                      </Badge>
                    </div>
                    {i < arr.length - 1 && <div className={`h-0.5 mt-1.5 rounded ${isCompleted ? "bg-primary/40" : "bg-muted"}`} />}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TopCard({ icon: Icon, label, value, sub, color, trend }: any) {
  return (
    <Card className="shadow-elegant hover:shadow-glow transition-all hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">{trend}</span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm font-medium mt-0.5">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}