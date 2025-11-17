import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getCompanyLogoUrl } from "@/lib/avatars";

interface DesktopAdSidebarProps {
  side: "left" | "right";
  onAdvertiseClick: () => void;
}

const allSponsors = [
  { 
    name: "Strava", 
    domain: "strava.com",
    description: "Track every mile with the #1 app for runners"
  },
  { 
    name: "On Running", 
    domain: "on-running.com",
    description: "Swiss engineered running shoes for peak performance"
  },
  { 
    name: "Nike", 
    domain: "nike.com",
    description: "Just do it. Performance gear trusted worldwide"
  },
  { 
    name: "Whoop", 
    domain: "whoop.com",
    description: "Optimize your training with recovery insights"
  },
  { 
    name: "Garmin", 
    domain: "garmin.com",
    description: "Advanced GPS watches for serious athletes"
  },
  { 
    name: "Hoka", 
    domain: "hoka.com",
    description: "Maximalist cushioning for comfort and speed"
  },
  { 
    name: "Brooks", 
    domain: "brooksrunning.com",
    description: "Run happy with shoes built for runners"
  },
  { 
    name: "Maurten", 
    domain: "maurten.com",
    description: "Hydrogel sports fuel used by elite athletes"
  },
  { 
    name: "Oura Ring", 
    domain: "ouraring.com",
    description: "Smart ring for sleep and recovery tracking"
  },
  { 
    name: "Tracksmith", 
    domain: "tracksmith.com",
    description: "Premium running apparel and community"
  },
];

export const DesktopAdSidebar = ({ side, onAdvertiseClick }: DesktopAdSidebarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate sponsors every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 5) % allSponsors.length);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Get 5 sponsors starting from current index
  const sponsors = Array.from({ length: 5 }, (_, i) => 
    allSponsors[(currentIndex + i) % allSponsors.length]
  );

  return (
    <div className={`hidden lg:flex fixed ${side === "left" ? "left-8" : "right-8"} top-1/2 -translate-y-1/2 flex-col gap-2 w-[220px] max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide pb-4`}>
      {/* Sponsor cards */}
      {sponsors.map((sponsor, index) => (
        <Card
          key={`${sponsor.name}-${index}-${currentIndex}`}
          className="flex-shrink-0 h-[110px] flex flex-col items-start justify-center gap-1.5 px-4 py-3 bg-card border-border hover:bg-muted/50 transition-all duration-300 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 w-full">
            <img
              src={getCompanyLogoUrl(sponsor.name)}
              alt={`${sponsor.name} logo`}
              className="h-8 w-8 object-contain flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm text-foreground">
              {sponsor.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
            {sponsor.description}
          </p>
        </Card>
      ))}

      {/* Advertise spot at bottom - only on right side */}
      {side === "right" && (
        <Card
          onClick={onAdvertiseClick}
          className="flex-shrink-0 h-[110px] flex flex-col items-start justify-center gap-1.5 px-4 py-3 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer mt-2"
        >
          <span className="font-semibold text-sm text-foreground">Advertise</span>
          <p className="text-xs text-muted-foreground leading-tight">
            Get your brand in front of dedicated runners
          </p>
        </Card>
      )}
    </div>
  );
};
