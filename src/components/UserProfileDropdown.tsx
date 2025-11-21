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

  if (!user) return null;

  // Show fallback UI if user exists but runner profile is missing
  const displayName = runnerData?.display_name || 'User';
  const avatarUrl = runnerData?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full focus:outline-none">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
          <Avatar className="h-10 w-10 border-2 border-primary/40 group-hover:border-primary/60 transition-all shadow-[0_0_8px_rgba(255,107,53,0.3)]">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">
              {displayName}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </DropdownMenuTrigger>
      <UserProfileMenu runnerId={runnerId} runnerData={runnerData} align="end" />
    </DropdownMenu>
  );
}
