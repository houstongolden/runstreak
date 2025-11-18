import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight } from "lucide-react";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function UserProfileDropdown() {
  const { user, runnerId, runnerData } = useAuth();

  if (!user || !runnerData) return null;

  const initials = runnerData.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full focus:outline-none">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={runnerData.avatar_url || undefined} alt={runnerData.display_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">
              {runnerData.display_name}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </DropdownMenuTrigger>
      <UserProfileMenu runnerId={runnerId} runnerData={runnerData} align="end" />
    </DropdownMenu>
  );
}
