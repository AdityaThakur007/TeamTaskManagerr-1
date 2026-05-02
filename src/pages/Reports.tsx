import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function Reports() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Reports — Taskify";
    load();
  }, []);

  async function load() {
    try {
      const [tData, pData] = await Promise.all([
        apiFetch("/tasks"),
        apiFetch("/projects")
      ]);
      setTasks(tData || []);
      setProjects(pData || []);
    } catch (e: any) {
      console.error(e);
    }
  }

  // Tasks created per day (last 14)
  const days = Array.from({ length: 14 }, (_, i) => startOfDay(subDays(new Date(), 13 - i)));
  const trend = days.map((d) => {
    const next = new Date(d.getTime() + 86400000);
    return {
      day: format(d, "MMM d"),
      Created: tasks.filter((t) => new Date(t.createdAt || Date.now()) >= d && new Date(t.createdAt || Date.now()) < next).length,
      Completed: tasks.filter((t) => t.status === "Done" && new Date(t.updatedAt || Date.now()) >= d && new Date(t.updatedAt || Date.now()) < next).length,
    };
  });

  const byProject = projects.map((p) => ({
    name: p.name.slice(0, 12),
    Pending: tasks.filter((t) => t.project === p._id && t.status === "Pending").length,
    "In Progress": tasks.filter((t) => t.project === p._id && t.status === "In Progress").length,
    Done: tasks.filter((t) => t.project === p._id && t.status === "Done").length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Insights across projects and tasks.</p>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Task Activity</CardTitle>
          <CardDescription>Created vs completed (last 14 days)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Created" stroke="hsl(var(--info))" strokeWidth={2} />
              <Line type="monotone" dataKey="Completed" stroke="hsl(var(--success))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Status by Project</CardTitle>
          <CardDescription>Breakdown across active projects</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer>
            <BarChart data={byProject}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pending" stackId="a" fill="hsl(var(--warning))" />
              <Bar dataKey="In Progress" stackId="a" fill="hsl(var(--info))" />
              <Bar dataKey="Done" stackId="a" fill="hsl(var(--success))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}