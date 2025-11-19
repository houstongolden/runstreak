import { Trophy, TrendingUp, Plus, Shield, Gift, Flame, Zap, Users, MessageSquare } from "lucide-react";
import ShinyText from "@/components/ui/shiny-text";
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
import { StreakCountdown } from "@/components/StreakCountdown";
import { format } from "date-fns";
import { Runner } from "@/types";

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
  const [currentRunner, setCurrentRunner] = useState<any>(null);

  useEffect(() => {
    setCurrentRunnerId(authRunnerId);
    if (authRunnerId) {
      fetchSessions();
      fetchCurrentRunner();
    }
  }, [authRunnerId]);

  const fetchCurrentRunner = async () => {
    if (!authRunnerId) return;
    
    const { data } = await supabase
      .from('runners')
      .select('*')
      .eq('id', authRunnerId)
      .maybeSingle();
    
    if (data) {
      setCurrentRunner(data);
    }
  };

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
    // Navigate with new=true parameter to create new chat
    window.location.href = `/coach/${authRunnerId}?new=true`;
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
      collapsible="offcanvas"
    >
      <SidebarContent className="flex flex-col h-full p-0">
        {/* Logo - Fixed at Top */}
        <div className="px-4 pt-4 pb-4 border-b border-border/50 flex-shrink-0 bg-sidebar">
          <div className="flex items-center gap-0.5">
            <Flame 
              className="h-7 w-7 animate-shiny-text"
              style={{
                stroke: 'url(#gradient-logo-sidebar)',
                fill: 'none',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 12px hsl(16 100% 50% / 0.5)) drop-shadow(0 0 20px hsl(16 100% 50% / 0.3))'
              }}
            />
            <span className="text-xl font-heading font-bold">
              <ShinyText text="RunStreaks" speed={5} />
            </span>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="gradient-logo-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(16 100% 50%)" />
                  <stop offset="100%" stopColor="hsl(14 100% 59%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Scrollable Content - Middle */}
        <div className="flex-1 overflow-hidden">
          {!user ? (
            <div className="px-2 py-4 h-full overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm mb-3">Start Your Streak</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-3">
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('strava-auth');
                          if (error) throw error;
                          if (data?.authUrl) {
                            // Open Strava OAuth in popup window
                            const width = 600;
                            const height = 700;
                            const left = window.screenX + (window.outerWidth - width) / 2;
                            const top = window.screenY + (window.outerHeight - height) / 2;
                            
                            const popup = window.open(
                              data.authUrl,
                              'stravaAuth',
                              `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
                            );
                            
                            // Listen for message from popup
                            const messageHandler = (event: MessageEvent) => {
                              if (event.origin !== window.location.origin) return;
                              
                              if (event.data.type === 'strava-auth-success') {
                                popup?.close();
                                if (event.data.runnerId) {
                                  window.location.href = `/runner/${event.data.runnerId}`;
                                }
                                window.removeEventListener('message', messageHandler);
                              } else if (event.data.type === 'strava-auth-error') {
                                popup?.close();
                                window.removeEventListener('message', messageHandler);
                              }
                            };
                            
                            window.addEventListener('message', messageHandler);
                          }
                        } catch (error) {
                          console.error('Error connecting to Strava:', error);
                        }
                      }}
                      className="hover:bg-primary/10 transition-all min-h-[72px] py-3 px-3 rounded-lg border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="p-2 rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="font-semibold text-sm leading-tight">Join Free - Takes 10s</span>
                          <span className="text-xs text-muted-foreground leading-tight">Connect Strava & start your streak</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div className="px-3 py-2">
                      <NavLink 
                        to="/auth" 
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline" 
                        onClick={handleNavClick}
                      >
                        Returning user? Sign in
                      </NavLink>
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/" 
                        className="hover:bg-muted/50 transition-all min-h-[72px] py-3 px-3 rounded-lg" 
                        activeClassName="bg-muted text-primary font-medium"
                        onClick={handleNavClick}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="p-2 rounded-md bg-muted/80 flex-shrink-0 mt-0.5">
                            <Users className="h-4 w-4 text-foreground" />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-semibold text-sm leading-tight">Browse Top Streakers</span>
                            <span className="text-xs text-muted-foreground leading-tight">See who's running daily</span>
                          </div>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ) : (
          <>
            <div className="h-full overflow-y-auto">
              {/* Streak Countdown - Sticky within scroll */}
              {currentRunner && <StreakCountdown lastActivityDate={currentRunner.last_activity_date} timezone={currentRunner.timezone || 'America/Los_Angeles'} variant="sidebar" />}
              
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
                      to="/inbox" 
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:text-foreground transition-colors"
                      activeClassName="text-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Inbox</span>
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
            </div>
          </>
        )}
        </div>

        {/* Fixed User Profile at Bottom - Only for authenticated users */}
        {user && (
          <div className="flex-shrink-0 border-t border-border bg-sidebar">
            <div className="p-3">
              <UserProfileDropdown />
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
