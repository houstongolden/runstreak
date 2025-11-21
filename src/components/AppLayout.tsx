import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UnverifiedAccountBanner from "@/components/UnverifiedAccountBanner";
import { UserAvatarHeader } from "@/components/UserAvatarHeader";
import { StreakCountdownBanner } from "@/components/StreakCountdownBanner";
import { InboxNotification } from "@/components/InboxNotification";
import runstreaksLogo from "@/assets/runstreaks-logo.png";
import { Link, useLocation } from "react-router-dom";
import ShinyText from "@/components/ui/shiny-text";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const handleStravaConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('strava-auth');
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      
      <div className="w-full min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-sidebar/50 backdrop-blur-[40px]">
          <div className="flex h-14 items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger />
              
              <Link to="/" className="flex items-center shrink-0" style={{ gap: '0.15em' }}>
                {!isHomepage && (
                  <img 
                    src={runstreaksLogo} 
                    alt="RunStreaks Logo"
                    className="h-7 w-7 sm:h-9 sm:w-9 object-contain transition-all duration-300 hover:animate-logo-glow hover:scale-110"
                    style={{
                      filter: isDark 
                        ? 'drop-shadow(0 0 12px hsl(16 100% 65% / 0.6)) drop-shadow(0 0 20px hsl(16 100% 65% / 0.4))' 
                        : 'drop-shadow(0 0 12px hsl(16 100% 50% / 0.5)) drop-shadow(0 0 20px hsl(16 100% 50% / 0.3))'
                    }}
                  />
                )}
                {!isHomepage && (
                  <span 
                    className="text-xl sm:text-2xl font-logo font-semibold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent uppercase"
                    style={{
                      transform: 'skewX(-6deg)',
                      letterSpacing: '0.01em'
                    }}
                  >
                    RunStreaks
                  </span>
                )}
              </Link>
            </div>

            {/* User Avatar Dropdown or Strava Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <InboxNotification />
                <UserAvatarHeader />
              </div>
            ) : (
              <Button
                onClick={handleStravaConnect}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm sm:text-base px-3 sm:px-4 shrink-0"
              >
                <img 
                  src="https://www.google.com/s2/favicons?domain=strava.com&sz=32" 
                  alt="Strava" 
                  className="h-4 w-4 mr-1.5 sm:mr-2"
                />
                <span className="hidden xs:inline">Connect with Strava</span>
                <span className="xs:hidden">Connect</span>
              </Button>
            )}
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
