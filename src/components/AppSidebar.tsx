import { Settings, User, Trophy, Sparkles, Edit, MessageSquare, Activity, TrendingUp, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Leaderboard", url: "/", icon: Trophy },
  { title: "My Profile", url: "", icon: User }, // URL will be dynamic
  { title: "Activities", url: "/activities", icon: Activity },
  { title: "Social Feed", url: "/feed", icon: TrendingUp },
  { title: "Discover", url: "/discover", icon: Users },
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
  const { runnerId: authRunnerId, signOut, user } = useAuth();
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);
  const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    // Use authenticated runner ID
    setCurrentRunnerId(authRunnerId);
    
    if (authRunnerId) {
      fetchCoachingSessions(authRunnerId);
    }
  }, [authRunnerId]);

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
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      setOpenMobile(false);
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      className="fixed left-0 top-0 z-50 h-screen"
    >
      <SidebarContent className="pt-14">
        {!user ? (
          // Not authenticated - only show Connect with Strava
          <SidebarGroup>
            <SidebarGroupLabel>Get Started</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/auth" 
                      className="hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Connect with Strava</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/" 
                      className="hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>View Leaderboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          // Authenticated - show full navigation
          <>
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
                      itemUrl = currentRunnerId ? `/runner/${currentRunnerId}` : "/auth";
                    } else if (item.title === "Edit Profile") {
                      itemUrl = currentRunnerId ? `/runner/${currentRunnerId}?edit=true` : "/auth";
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
          </>
        )}
      </SidebarContent>
      
      {/* Logout Button */}
      {user && (
        <SidebarFooter className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
