import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function Team() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Team — Taskify";
    load();
  }, []);

  async function load() {
    try {
      const data = await apiFetch("/users");
      setMembers(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading team...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground mt-1">Everyone in your workspace.</p>
      </div>

      {members.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
          No team members yet.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const displayName = m.name || m.email || "User";
            const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <Card key={m._id} className="shadow-elegant hover:shadow-glow transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="gradient-primary text-white font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant={m.role === "Admin" ? "default" : "secondary"} className="capitalize text-[10px]">
                        {m.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}