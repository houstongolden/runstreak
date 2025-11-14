import { Settings, User, Trophy, Sparkles, Edit, MessageSquare, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Leaderboard", url: "/", icon: Trophy },
  { title: "My Profile", url: "", icon: User }, // URL will be dynamic
  { title: "Activities", url: "/activities", icon: Activity },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Edit Profile", url: "", icon: Edit }, // URL will be dynamic
];

interface CoachingSession {
  id: string;
  title: string;
  last_message_at: string;
}

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);
  const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    // Get current runner from localStorage (set during Strava connection)
    const runnerId = localStorage.getItem('current_runner_id');
    setCurrentRunnerId(runnerId);
    
    if (runnerId) {
      fetchCoachingSessions(runnerId);
    }
  }, []);

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const fetchCoachingSessions = async (runnerId: string) => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('runner_id', runnerId)
        .order('last_message_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setCoachingSessions(data || []);
    } catch (error) {
      console.error('Error fetching coaching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      className="fixed left-0 top-0 z-50 h-screen"
    >
      <SidebarContent className="pt-14">
        <SidebarGroup>
          <SidebarGroupLabel>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Set dynamic URL for My Profile and Edit Profile
                let itemUrl = item.url;
                if (item.title === "My Profile") {
                  itemUrl = currentRunnerId ? `/runner/${currentRunnerId}` : "/connect";
                } else if (item.title === "Edit Profile") {
                  itemUrl = currentRunnerId ? `/runner/${currentRunnerId}?edit=true` : "/connect";
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={itemUrl} 
                        end={item.url === "/"} 
                        className="hover:bg-muted/50" 
                        activeClassName="bg-muted text-primary font-medium"
                        onClick={handleNavClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Assistant Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase">
            AI Assistant
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/coach" 
                    className="hover:bg-muted/50" 
                    activeClassName="bg-muted text-primary font-medium"
                    onClick={handleNavClick}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>AI Coach</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Coaching Sessions Section */}
        {currentRunnerId && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase">
              Coaching Sessions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loadingSessions ? (
                  <SidebarMenuItem>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  </SidebarMenuItem>
                ) : coachingSessions.length > 0 ? (
                  coachingSessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={`/coach?session=${session.id}`}
                          className="hover:bg-muted/50" 
                          activeClassName="bg-muted text-primary font-medium"
                          onClick={handleNavClick}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{session.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No sessions yet
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
