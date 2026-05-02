import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format, isPast, differenceInDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, FolderKanban, Users, ListTodo, Loader2,
  Search, Filter, X, CalendarDays, TrendingUp, AlertTriangle,
  Clock, ArrowUpDown, Eye, Edit2, Star,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type Priority = "Low" | "Medium" | "High";
type ProjectStatus = "Planning" | "On Track" | "At Risk" | "Delayed" | "Completed";

const PRIORITY_COLOR: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-warning/15 text-warning border-warning/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
};
const PRIORITY_DOT: Record<Priority, string> = { Low: "bg-muted-foreground", Medium: "bg-warning", High: "bg-destructive" };

const STATUS_STYLE: Record<ProjectStatus, string> = {
  Completed: "bg-success/15 text-success border-success/30",
  "On Track": "bg-info/15 text-info border-info/30",
  "At Risk": "bg-warning/15 text-warning border-warning/30",
  Delayed: "bg-destructive/15 text-destructive border-destructive/30",
  Planning: "bg-muted text-muted-foreground",
};
const STATUS_BAR: Record<ProjectStatus, string> = {
  Completed: "bg-success", "On Track": "bg-info", "At Risk": "bg-warning", Delayed: "bg-destructive", Planning: "bg-primary",
};

// ── Main Page ──────────────────────────────────────────────────────
export default function Projects() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "Admin";

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Form
  const [form, setForm] = useState({ name: "", description: "", priority: "Medium", status: "Planning", startDate: "", endDate: "" });
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Projects — Taskify";
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [pData, uData] = await Promise.all([apiFetch("/projects"), apiFetch("/users")]);
      setProjects(pData || []);
      setUsers(uData || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // ── Filtered & Sorted ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...projects];
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "all") list = list.filter((p) => (p.computedStatus || p.status) === filterStatus);
    if (filterPriority !== "all") list = list.filter((p) => p.priority === filterPriority);
    if (sortBy === "date") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortBy === "progress") list.sort((a, b) => b.progress - a.progress);
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "due") list.sort((a, b) => (a.endDate ? new Date(a.endDate).getTime() : Infinity) - (b.endDate ? new Date(b.endDate).getTime() : Infinity));
    return list;
  }, [projects, search, filterStatus, filterPriority, sortBy]);

  const hasFilters = search || filterStatus !== "all" || filterPriority !== "all";
  const stats = {
    total: projects.length,
    completed: projects.filter((p) => (p.computedStatus || p.status) === "Completed").length,
    onTrack: projects.filter((p) => (p.computedStatus || p.status) === "On Track").length,
    atRisk: projects.filter((p) => ["At Risk", "Delayed"].includes(p.computedStatus || p.status)).length,
    overdue: projects.filter((p) => p.endDate && isPast(new Date(p.endDate)) && (p.computedStatus || p.status) !== "Completed").length,
  };

  function resetForm() {
    setForm({ name: "", description: "", priority: "Medium", status: "Planning", startDate: "", endDate: "" });
    setSelectedMembers(new Set());
  }

  async function handleCreate() {
    if (!form.name.trim()) return toast.error("Project name is required");
    setBusy(true);
    try {
      const data = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ ...form, members: Array.from(selectedMembers) }),
      });
      setProjects((prev) => [data, ...prev]);
      toast.success("Project created! 🎉");
      setCreateOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    if (!editProject || !form.name.trim()) return;
    setBusy(true);
    try {
      const data = await apiFetch(`/projects/${editProject._id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProjects((prev) => prev.map((p) => p._id === data._id ? data : p));
      toast.success("Project updated");
      setEditProject(null);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  }

  function openEdit(p: any) {
    setForm({ name: p.name, description: p.description || "", priority: p.priority || "Medium", status: p.status || "Planning", startDate: p.startDate ? p.startDate.slice(0, 10) : "", endDate: p.endDate ? p.endDate.slice(0, 10) : "" });
    setEditProject(p);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Plan, track, and deliver your team's work.</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white shadow-glow">
                <Plus className="h-4 w-4 mr-2" />New Project
              </Button>
            </DialogTrigger>
            <ProjectFormDialog
              title="Create New Project"
              form={form} setForm={setForm}
              users={users} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers}
              onSubmit={handleCreate} onCancel={() => { setCreateOpen(false); resetForm(); }}
              busy={busy} submitLabel="Create Project"
            />
          </Dialog>
        )}
      </div>

      {/* ── Stats Banner ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FolderKanban, cls: "text-primary" },
          { label: "Completed", value: stats.completed, icon: TrendingUp, cls: "text-success" },
          { label: "On Track", value: stats.onTrack, icon: Star, cls: "text-info" },
          { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, cls: "text-warning" },
          { label: "Overdue", value: stats.overdue, icon: Clock, cls: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="shadow-elegant hover:shadow-glow transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-7 w-7 ${s.cls} shrink-0`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <Card className="shadow-elegant">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[140px] text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["Planning", "On Track", "At Risk", "Delayed", "Completed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 w-[130px] text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {["Low", "Medium", "High"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[120px] text-sm border-0 bg-transparent shadow-none focus:ring-0 p-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="due">Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground"
                onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPriority("all"); }}>
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {projects.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Empty State ── */}
      {projects.length === 0 && (
        <Card className="shadow-elegant">
          <CardContent className="py-20 text-center">
            <div className="h-20 w-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center shadow-glow">
              <FolderKanban className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {isAdmin ? "Create your first project to start organizing tasks and collaborating with your team." : "No projects have been assigned to you yet. Ask an Admin to get started."}
            </p>
            {isAdmin && (
              <Button className="gradient-primary text-white shadow-glow" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Create First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Project Grid ── */}
      {filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const status: ProjectStatus = (p.computedStatus || p.status) as ProjectStatus;
            const isOverdue = p.endDate && isPast(new Date(p.endDate)) && status !== "Completed";
            const daysLeft = p.endDate ? differenceInDays(new Date(p.endDate), new Date()) : null;
            return (
              <Card key={p._id}
                className={`shadow-elegant hover:shadow-glow transition-all hover:-translate-y-1 group cursor-pointer ${isOverdue ? "border-destructive/40" : ""}`}
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                <CardHeader className="pb-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                      <FolderKanban className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLOR[p.priority as Priority] || ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1 ${PRIORITY_DOT[p.priority as Priority]}`} />
                        {p.priority || "Medium"}
                      </Badge>
                      {isAdmin && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>All tasks in this project will be permanently deleted.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(p._id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                    {p.description && <CardDescription className="line-clamp-2 mt-0.5 text-xs">{p.description}</CardDescription>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Status + Progress */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[status]}`}>{status}</Badge>
                    <span className="text-xs font-semibold tabular-nums">{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${STATUS_BAR[status]}`} style={{ width: `${p.progress}%` }} />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-3">
                      {/* Member avatars */}
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1.5">
                          {(p.members || []).slice(0, 3).map((m: any) => (
                            <div key={m._id} title={m.name} className="h-5 w-5 rounded-full gradient-primary text-[8px] font-bold text-white flex items-center justify-center border border-card">
                              {(m.name || "?")[0].toUpperCase()}
                            </div>
                          ))}
                          {(p.members || []).length > 3 && (
                            <div className="h-5 w-5 rounded-full bg-muted text-[8px] font-bold flex items-center justify-center border border-card">
                              +{p.members.length - 3}
                            </div>
                          )}
                        </div>
                        <span>{p.members?.length || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ListTodo className="h-3 w-3" />
                        <span>{p.taskCount || 0} tasks</span>
                      </div>
                    </div>
                    {/* Due date */}
                    {p.endDate && (
                      <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : daysLeft !== null && daysLeft <= 7 ? "text-warning" : ""}`}>
                        <CalendarDays className="h-3 w-3" />
                        {daysLeft !== null && daysLeft < 0
                          ? `${Math.abs(daysLeft)}d overdue`
                          : daysLeft === 0 ? "Due today"
                          : daysLeft !== null && daysLeft <= 7 ? `${daysLeft}d left`
                          : format(new Date(p.endDate), "MMM d")}
                      </div>
                    )}
                  </div>

                  {/* View details */}
                  <div className="pt-1 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.doneCount || 0}/{p.taskCount || 0} tasks done</span>
                      <span className="text-primary flex items-center gap-1 group-hover:underline">
                        <Eye className="h-3 w-3" />View details
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No results for filters */}
      {projects.length > 0 && filtered.length === 0 && (
        <Card className="shadow-elegant">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No projects match your filters.</p>
            <Button variant="link" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPriority("all"); }}>Clear filters</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Edit Dialog ── */}
      {editProject && (
        <Dialog open={!!editProject} onOpenChange={(o) => { if (!o) setEditProject(null); }}>
          <ProjectFormDialog
            title={`Edit: ${editProject.name}`}
            form={form} setForm={setForm}
            users={users} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers}
            onSubmit={handleEdit} onCancel={() => setEditProject(null)}
            busy={busy} submitLabel="Save Changes" showMembers={false}
          />
        </Dialog>
      )}
    </div>
  );
}

// ── Shared Form Dialog ─────────────────────────────────────────────
function ProjectFormDialog({ title, form, setForm, users, selectedMembers, setSelectedMembers, onSubmit, onCancel, busy, submitLabel, showMembers = true }: any) {
  function field(key: string, val: any) { setForm((f: any) => ({ ...f, [key]: val })); }
  function toggleMember(id: string) {
    setSelectedMembers((s: Set<string>) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        {/* Name */}
        <div>
          <Label>Project Name *</Label>
          <Input value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="e.g. Website Redesign" className="mt-1" />
        </div>
        {/* Description */}
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => field("description", e.target.value)} placeholder="What is this project about?" className="mt-1" rows={3} />
        </div>
        {/* Priority + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => field("priority", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Low", "Medium", "High"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => field("status", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Planning", "On Track", "At Risk", "Delayed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => field("startDate", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={form.endDate} onChange={(e) => field("endDate", e.target.value)} className="mt-1" />
          </div>
        </div>
        {/* Members */}
        {showMembers && users.length > 0 && (
          <div>
            <Label>Team Members</Label>
            <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 bg-muted/20">
              {users.map((u: any) => (
                <label key={u._id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-accent rounded-md px-2 py-1.5 transition-colors">
                  <Checkbox checked={selectedMembers.has(u._id)} onCheckedChange={() => toggleMember(u._id)} />
                  <div className="h-6 w-6 rounded-full gradient-primary text-[10px] font-bold text-white flex items-center justify-center">{(u.name || "?")[0].toUpperCase()}</div>
                  <span className="flex-1 font-medium">{u.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSubmit} disabled={busy} className="gradient-primary text-white">
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}