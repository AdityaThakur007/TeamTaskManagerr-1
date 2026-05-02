import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserMenu() {
  const { user, role, signOut } = useAuth();
  const displayName = user?.name || user?.email || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-2 gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs gradient-primary text-white">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2">
          <span className="font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <ShieldCheck className="h-4 w-4 mr-2" />
          Role: <Badge variant="secondary" className="ml-1 capitalize">{role}</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}