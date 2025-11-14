import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import ShinyText from "@/components/ui/shiny-text";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              
              <Link to="/" className="flex items-center gap-2">
                <Flame 
                  className="h-6 w-6 animate-shiny-text"
                  style={{
                    stroke: 'url(#gradient-logo-header)',
                    fill: 'none',
                    strokeWidth: 2
                  }}
                />
                <span className="font-instrument-serif text-xl font-normal">
                  <ShinyText text="RunStreak" speed={5} />
                </span>
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="gradient-logo-header" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(25 100% 60%)" />
                      <stop offset="100%" stopColor="hsl(15 100% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </Link>

              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
