import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function UserAvatarHeader() {
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
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-primary/40 hover:border-primary/60 transition-all cursor-pointer shadow-[0_0_8px_rgba(255,107,53,0.3)]">
          <AvatarImage src={runnerData.avatar_url || undefined} alt={runnerData.display_name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <UserProfileMenu runnerId={runnerId} runnerData={runnerData} align="end" />
    </DropdownMenu>
  );
}