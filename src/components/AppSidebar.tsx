import { Trophy, TrendingUp, Sparkles, Plus, Shield, Gift, Flame } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { format } from "date-fns";

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

interface CoachingSession {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { runnerId: authRunnerId, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);

  useEffect(() => {
    setCurrentRunnerId(authRunnerId);
    if (authRunnerId) {
      fetchSessions();
    }
  }, [authRunnerId]);

  const fetchSessions = async () => {
    if (!authRunnerId) return;
    
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('runner_id', authRunnerId)
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setSessions(data);
    }
  };

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const handleNewChat = () => {
    // Navigate without session parameter to create new chat
    window.location.href = `/coach/${authRunnerId}`;
    setOpenMobile(false);
  };

  const handleSessionSelect = (sessionId: string) => {
    window.location.href = `/coach/${authRunnerId}?session=${sessionId}`;
    setOpenMobile(false);
  };

  // Get current session ID from URL
  const currentSessionId = new URLSearchParams(location.search).get('session');

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      className="fixed left-0 top-0 z-50 h-screen"
    >
      <SidebarContent className="pt-14 pb-0">
        {/* Logo */}
        <div className="px-4 py-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="font-pixelify text-lg font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              RunStreak
            </span>
          </div>
        </div>
        {!user ? (
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
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              {/* Main Navigation */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/" 
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:text-foreground transition-colors"
                      activeClassName="text-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Leaderboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={currentRunnerId ? `/runner/${currentRunnerId}` : "#"}
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:text-foreground transition-colors"
                      activeClassName="text-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>My Profile</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Social Navigation */}
              <SidebarGroup>
                <SidebarGroupLabel>Social</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/feed" 
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:text-foreground transition-colors"
                      activeClassName="text-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Feed</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/invite" 
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:text-foreground transition-colors"
                      activeClassName="text-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <Gift className="h-4 w-4" />
                      <span>Invite Friends</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <Separator className="my-2" />

              {/* AI Coach Section */}
              <SidebarGroup>
                <div className="px-2 mb-2">
                  <SidebarGroupLabel className="mb-2">AI Coach</SidebarGroupLabel>
                  <button 
                    onClick={handleNewChat}
                    className="w-full text-left py-2 px-3 text-sm bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    New Chat
                  </button>
                </div>

                <SidebarGroupLabel className="px-2 mt-3">Chat History</SidebarGroupLabel>
                <SidebarGroupContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-0.5 pl-2">
                      {sessions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          No chats yet
                        </div>
                      ) : (
                        sessions.map((session) => {
                          const isActive = currentSessionId === session.id;
                          return (
                            <button
                              key={session.id}
                              className={`w-full text-left py-1.5 px-1 text-xs transition-colors ${
                                isActive
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => handleSessionSelect(session.id)}
                            >
                              <div className="truncate leading-tight max-w-[140px]">{session.title}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {format(new Date(session.last_message_at), 'MMM d')}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Admin Dashboard */}
              {isAdmin && (
                <>
                  <Separator className="my-2" />
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to="/admin" 
                              className="flex items-center gap-2 py-2 px-3 text-sm text-destructive hover:text-destructive transition-colors"
                              activeClassName="text-destructive font-medium"
                              onClick={handleNavClick}
                            >
                              <Shield className="h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}
            </ScrollArea>

            {/* Fixed User Profile at Bottom */}
            <div className="mt-auto border-t border-border p-3">
              <UserProfileDropdown />
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
