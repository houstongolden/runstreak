import { Settings, User, Trophy, Sparkles, TrendingUp, Users, LogOut, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
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

const mainNavItems = [
  { title: "Leaderboard", url: "/", icon: Trophy },
  { title: "My Profile", url: "", icon: User }, // URL will be dynamic
];

const communityNavItems = [
  { title: "Social Feed", url: "/feed", icon: TrendingUp },
  { title: "Discover", url: "/discover", icon: Users },
];

const toolsNavItems = [
  { title: "AI Coach", url: "/coach", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { runnerId: authRunnerId, signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);

  useEffect(() => {
    // Use authenticated runner ID
    setCurrentRunnerId(authRunnerId);
  }, [authRunnerId]);

  const handleNavClick = () => {
    setOpenMobile(false);
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
          // Authenticated - show organized navigation
          <>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => {
                    let itemUrl = item.url;
                    if (item.title === "My Profile") {
                      itemUrl = currentRunnerId ? `/runner/${currentRunnerId}` : "/auth";
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

            {/* Community Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Community</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {communityNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className="hover:bg-muted/50" 
                          activeClassName="bg-muted text-primary font-medium"
                          onClick={handleNavClick}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Tools Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className="hover:bg-muted/50" 
                          activeClassName="bg-muted text-primary font-medium"
                          onClick={handleNavClick}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      {/* Admin Section */}
      {user && isAdmin && (
        <SidebarFooter className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpenMobile(false);
              window.location.href = '/admin';
            }}
            className="w-full justify-start"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
        </SidebarFooter>
      )}
      
      {/* Logout Button */}
      {user && (
        <SidebarFooter className={`p-4 ${!isAdmin ? 'border-t' : ''}`}>
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
