import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, AlertCircle, Loader2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { apiFetch } from "@/lib/api";

type TaskStatus = "Pending" | "In Progress" | "Done";
const STATUS_LABELS: Record<TaskStatus, string> = { "Pending": "To Do", "In Progress": "In Progress", "Done": "Done" };
const STATUS_ORDER: TaskStatus[] = ["Pending", "In Progress", "Done"];
const STATUS_DOT: Record<TaskStatus, string> = { "Pending": "bg-warning", "In Progress": "bg-info", "Done": "bg-success" };

export default function Tasks() {
  const { user, role } = useAuth();
  const isAdmin = role === "Admin";
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignee, setAssignee] = useState<string>("self");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    document.title = "Tasks — Taskify";
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [tData, pData, uData] = await Promise.all([
        apiFetch("/tasks"),
        apiFetch("/projects"),
        apiFetch("/users"),
      ]);
      setTasks(tData || []);
      setProjects(pData || []);
      setUsers(uData || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterProject !== "all" && (t.project?._id || t.project) !== filterProject) return false;
      if (filterUser !== "all") {
        const aid = t.assignedTo?._id || t.assignedTo;
        if (aid !== filterUser) return false;
      }
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterStatus, filterProject, filterUser, search]);

  const hasFilters = filterStatus !== "all" || filterProject !== "all" || filterUser !== "all" || search;

  function clearFilters() {
    setFilterStatus("all");
    setFilterProject("all");
    setFilterUser("all");
    setSearch("");
  }

  async function createTask() {
    if (!title.trim() || !projectId) return toast.error("Title and project are required");
    setBusy(true);
    try {
      const newTask = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          project: projectId,
          assignedTo: assignee === "self" ? user?._id : assignee,
          status: "Pending",
          dueDate: dueDate || null,
        }),
      });
      setTasks((prev) => [newTask, ...prev]);
      toast.success("Task created");
      setOpen(false);
      setTitle(""); setDescription(""); setProjectId(""); setAssignee("self"); setDueDate("");
    } catch (e: any) {
      toast.error(e.message || "Failed to create task");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(id: string) {
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
      toast.success("Task deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    try {
      const updated = await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setTasks((prev) => prev.map((t) => (t._id || t.id) === id ? updated : t));
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
      load();
    }
  }

  function onDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => (t._id || t.id) === active.id);
    if (!task || task.status === newStatus) return;
    const isAssigned = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
    if (!isAdmin && !isAssigned) { toast.error("You can only move tasks assigned to you"); return; }
    setTasks((prev) => prev.map((t) => (t._id || t.id) === (task._id || task.id) ? { ...t, status: newStatus } : t));
    updateStatus(task._id || task.id, newStatus);
  }

  const activeTask = tasks.find((t) => (t._id || t.id) === activeId);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Manage all tasks. Drag cards to update status." : "Your assigned tasks. Drag cards to update status."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white shadow-glow"><Plus className="h-4 w-4 mr-2" />New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
                </div>
                <div>
                  <Label>Project *</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Myself</SelectItem>
                      {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.name} · {u.role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createTask} disabled={busy} className="gradient-primary text-white">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ─── FILTERS ─── */}
      <Card className="shadow-elegant">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />Filters
            </div>
            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {/* Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[140px] text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Project */}
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="h-8 w-[160px] text-sm"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* User */}
            {isAdmin && (
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-8 w-[150px] text-sm"><SelectValue placeholder="Assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {tasks.length} tasks</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── KANBAN BOARD ─── */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-4 lg:grid-cols-3">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={filtered.filter((t) => t.status === status)}
              isAdmin={isAdmin}
              userId={user?._id}
              onDelete={deleteTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCardView task={activeTask} dragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, tasks, isAdmin, userId, onDelete }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card ref={setNodeRef} className={`shadow-elegant transition-all duration-200 ${isOver ? "ring-2 ring-primary scale-[1.01] shadow-glow" : ""}`}>
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status as TaskStatus]}`} />
            {STATUS_LABELS[status as TaskStatus]}
          </span>
          <Badge variant="secondary" className="font-semibold">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 min-h-[220px] pb-4">
        {tasks.map((t: any) => {
          const isAssigned = t.assignedTo?._id === userId || t.assignedTo === userId;
          return (
            <DraggableTask
              key={t._id || t.id}
              task={t}
              canDrag={isAdmin || isAssigned}
              canDelete={isAdmin}
              onDelete={onDelete}
            />
          );
        })}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-[140px] border-2 border-dashed border-muted rounded-xl">
            <p className="text-xs text-muted-foreground">Drop tasks here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableTask({ task, canDrag, canDelete, onDelete }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task._id || task.id, disabled: !canDrag });
  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      className={`${isDragging ? "opacity-25" : ""} ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <TaskCardView task={task} canDelete={canDelete} onDelete={onDelete} />
    </div>
  );
}

function TaskCardView({ task, dragging, canDelete, onDelete }: any) {
  const overdue = task.dueDate && task.status !== "Done" && isPast(new Date(task.dueDate));
  const assigneeName = task.assignedTo?.name || task.assignedTo?.email || "Unassigned";

  return (
    <div className={`group rounded-xl border bg-card p-3.5 transition-all
      ${dragging ? "shadow-glow rotate-1 border-primary/40" : "shadow-sm hover:border-primary/30 hover:shadow-md"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold leading-snug">{task.title}</p>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task._id || task.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {task.project?.name && (
          <Badge variant="outline" className="text-[10px] py-0 h-4">{task.project.name}</Badge>
        )}
        {task.dueDate && (
          <Badge variant={overdue ? "destructive" : "secondary"} className="text-[10px] py-0 h-4 flex items-center gap-0.5">
            {overdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
            {format(new Date(task.dueDate), "MMM d")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
        <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-white">
          {assigneeName[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-muted-foreground">{assigneeName}</span>
      </div>
    </div>
  );
}