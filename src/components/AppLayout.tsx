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
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full bg-background relative">
        <AppSidebar />
        
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              
              <Link to="/" className="flex items-center gap-2 group">
                <Flame 
                  className="h-6 w-6 animate-shiny-text transition-all duration-300 group-hover:scale-110"
                  style={{
                    stroke: 'url(#gradient-logo-header)',
                    fill: 'none',
                    strokeWidth: 2,
                    filter: 'drop-shadow(0 0 8px hsl(22 93% 55% / 0.3))'
                  }}
                />
                <span className="font-instrument-serif text-xl font-normal transition-all duration-300 group-hover:scale-105">
                  <ShinyText text="RunStreak" speed={5} />
                </span>
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="gradient-logo-header" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(22 93% 55%)" />
                      <stop offset="100%" stopColor="hsl(30 100% 60%)" />
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
