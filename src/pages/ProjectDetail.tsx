import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format, isPast, formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Users, ListTodo, CalendarDays, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, Loader2, Activity, FolderKanban,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-success/15 text-success border-success/30",
  "On Track": "bg-info/15 text-info border-info/30",
  "At Risk": "bg-warning/15 text-warning border-warning/30",
  Delayed: "bg-destructive/15 text-destructive border-destructive/30",
  Planning: "bg-muted text-muted-foreground",
};

const TASK_COLORS: Record<string, string> = {
  Pending: "hsl(38 92% 50%)",
  "In Progress": "hsl(199 89% 48%)",
  Done: "hsl(142 71% 45%)",
};

const TASK_BADGE: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  "In Progress": "bg-info/15 text-info border-info/30",
  Done: "bg-success/15 text-success border-success/30",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === "Admin";

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/projects/${id}`);
      setProject(data);
      document.title = `${data.name} — Taskify`;
    } catch (e: any) {
      toast.error(e.message || "Failed to load project");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success("Status updated");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!project) return null;

  const status = project.computedStatus || project.status;
  const isOverdue = project.endDate && isPast(new Date(project.endDate)) && status !== "Completed";
  const tasks: any[] = project.tasks || [];

  // Task breakdown for pie chart
  const taskBreakdown = [
    { name: "Pending", value: tasks.filter((t) => t.status === "Pending").length },
    { name: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length },
    { name: "Done", value: tasks.filter((t) => t.status === "Done").length },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* ── Back + Header ── */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="-ml-2 shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <FolderKanban className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={`${STATUS_STYLE[status]}`}>{status}</Badge>
              {project.priority && (
                <Badge variant="outline" className="text-[10px]">{project.priority} Priority</Badge>
              )}
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
            </div>
            {project.description && <p className="text-muted-foreground mt-1 text-sm max-w-xl">{project.description}</p>}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: ListTodo, label: "Total Tasks", value: tasks.length, cls: "text-primary bg-primary/10" },
          { icon: CheckCircle2, label: "Completed", value: tasks.filter((t) => t.status === "Done").length, cls: "text-success bg-success/10" },
          { icon: Clock, label: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length, cls: "text-info bg-info/10" },
          { icon: AlertTriangle, label: "Overdue Tasks", value: tasks.filter((t) => t.status !== "Done" && t.dueDate && isPast(new Date(t.dueDate))).length, cls: "text-destructive bg-destructive/10" },
        ].map((s) => (
          <Card key={s.label} className="shadow-elegant">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.cls}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Progress + Chart + Team ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Progress Card */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-primary">{project.progress}%</div>
              <div className="text-sm text-muted-foreground mt-1">Complete</div>
            </div>
            <Progress value={project.progress} className="h-3" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              {project.startDate && (
                <div className="text-muted-foreground">
                  <div className="font-medium text-foreground">Start Date</div>
                  {format(new Date(project.startDate), "MMM d, yyyy")}
                </div>
              )}
              {project.endDate && (
                <div className="text-muted-foreground">
                  <div className="font-medium text-foreground">End Date</div>
                  <span className={isOverdue ? "text-destructive" : ""}>{format(new Date(project.endDate), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
            {project.endDate && (
              <div className={`text-xs text-center p-2 rounded-lg ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                {isOverdue
                  ? `${Math.abs(Math.round((new Date().getTime() - new Date(project.endDate).getTime()) / 86400000))} days overdue`
                  : status === "Completed" ? "Project completed! 🎉"
                  : `Due ${formatDistanceToNow(new Date(project.endDate), { addSuffix: true })}`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Breakdown Pie */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Breakdown</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            {taskBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No tasks yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {taskBreakdown.map((d) => <Cell key={d.name} fill={TASK_COLORS[d.name]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />Team Members
            </CardTitle>
            <CardDescription>{project.members?.length || 0} members</CardDescription>
          </CardHeader>
          <CardContent>
            {(project.members || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned</p>
            ) : (
              <div className="space-y-2">
                {project.members.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full gradient-primary text-xs font-bold text-white flex items-center justify-center shrink-0">
                      {(m.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Task List ── */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4" />Tasks ({tasks.length})
          </CardTitle>
          <CardDescription>All tasks in this project</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No tasks yet. Create tasks from the Tasks page.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((t: any) => {
                const taskOverdue = t.dueDate && t.status !== "Done" && isPast(new Date(t.dueDate));
                return (
                  <div key={t._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-accent/30 ${taskOverdue ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.status === "Done" ? "bg-success" : t.status === "In Progress" ? "bg-info" : "bg-warning"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${t.status === "Done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.assignedTo && <span className="text-xs text-muted-foreground">👤 {t.assignedTo.name}</span>}
                        {t.dueDate && (
                          <span className={`text-xs flex items-center gap-0.5 ${taskOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                            <CalendarDays className="h-3 w-3" />{format(new Date(t.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${TASK_BADGE[t.status]}`}>{t.status}</Badge>
                    {(isAdmin || true) && (
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-border rounded-md px-1.5 py-0.5 bg-background cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Activity Log ── */}
      {(project.activity || []).length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...project.activity].reverse().slice(0, 10).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
                    {a.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
