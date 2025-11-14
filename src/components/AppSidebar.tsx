import { Home, Settings, User, Trophy, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

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
  { title: "AI Coach", url: "/coach", icon: Sparkles, dynamic: true },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  // Extract runner ID from current path if available
  const runnerIdMatch = currentPath.match(/\/runner\/([^/]+)/);
  const runnerId = runnerIdMatch ? runnerIdMatch[1] : null;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
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
                const itemUrl = item.dynamic && runnerId ? `${item.url}/${runnerId}` : item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={itemUrl} 
                        end={item.url === "/"} 
                        className="hover:bg-muted/50" 
                        activeClassName="bg-muted text-primary font-medium"
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
      </SidebarContent>
    </Sidebar>
  );
}
