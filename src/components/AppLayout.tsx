import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UnverifiedAccountBanner from "@/components/UnverifiedAccountBanner";
import { UserAvatarHeader } from "@/components/UserAvatarHeader";
import { StreakCountdownBanner } from "@/components/StreakCountdownBanner";
import { Flame } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ShinyText from "@/components/ui/shiny-text";
import { useTheme } from "next-themes";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      
      <div className="w-full min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-sidebar/50 backdrop-blur-[40px]">
          <div className="flex h-14 items-center justify-between px-4 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              
              <Link to="/" className="flex items-center gap-0.5">
                {!isHomepage && (
                  <Flame 
                    className="h-7 w-7 animate-shiny-text"
                    style={{
                      stroke: isDark ? 'url(#gradient-logo-dark)' : 'url(#gradient-logo-light)',
                      fill: 'none',
                      strokeWidth: 2,
                      filter: isDark 
                        ? 'drop-shadow(0 0 12px hsl(16 100% 65% / 0.6)) drop-shadow(0 0 20px hsl(16 100% 65% / 0.4))' 
                        : 'drop-shadow(0 0 12px hsl(16 100% 50% / 0.5)) drop-shadow(0 0 20px hsl(16 100% 50% / 0.3))'
                    }}
                  />
                )}
                {!isHomepage && (
                  <span className="text-xl font-heading font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    RunStreaks
                  </span>
                )}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="gradient-logo-light" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(16 100% 50%)" />
                      <stop offset="100%" stopColor="hsl(14 100% 59%)" />
                    </linearGradient>
                    <linearGradient id="gradient-logo-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(16 100% 70%)" />
                      <stop offset="100%" stopColor="hsl(14 100% 75%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </Link>
            </div>

            {/* User Avatar Dropdown */}
            <UserAvatarHeader />
          </div>
        </header>

        {/* Streak Countdown Banner - Shows site-wide when user hasn't run today */}
        <StreakCountdownBanner />

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-6 sm:px-8 lg:px-16 xl:px-24 py-4">
            <UnverifiedAccountBanner />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
