import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function UserAvatarHeader() {
  const { user, runnerId } = useAuth();
  const [runnerData, setRunnerData] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (runnerId) {
      fetchRunnerData();
    }
  }, [runnerId]);

  const fetchRunnerData = async () => {
    if (!runnerId) return;
    
    const { data } = await supabase
      .from('runners')
      .select('display_name, avatar_url')
      .eq('id', runnerId)
      .single();
    
    if (data) {
      setRunnerData(data);
    }
  };

  if (!user) return null;

  const initials = runnerData?.display_name
    ? runnerData.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-border hover:border-primary transition-colors cursor-pointer">
          {runnerData?.avatar_url && (
            <AvatarImage src={runnerData.avatar_url} alt={runnerData.display_name} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <UserProfileMenu runnerId={runnerId} runnerData={runnerData} align="end" />
    </DropdownMenu>
  );
}