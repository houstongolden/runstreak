import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getCompanyLogoUrl } from "@/lib/avatars";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

interface DesktopAdSidebarProps {
  side: "left" | "right";
  onAdvertiseClick: () => void;
}

interface AdSpot {
  id: string;
  company_name: string;
  domain: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

export const DesktopAdSidebar = ({ side, onAdvertiseClick }: DesktopAdSidebarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adSpots, setAdSpots] = useState<AdSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdSpots();
  }, []);

  const fetchAdSpots = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_spots')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAdSpots(data || []);
    } catch (error) {
      console.error('Error fetching ad spots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rotate sponsors every 20 seconds
  useEffect(() => {
    if (adSpots.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, Math.ceil(adSpots.length / 2)));
    }, 20000);

    return () => clearInterval(interval);
  }, [adSpots.length]);

  if (loading) return null;

  // Both sides get 5 spots total
  const totalSlots = 5;
  
  // Split active sponsors between left and right sidebars
  const midpoint = Math.ceil(adSpots.length / 2);
  const sideSpots = side === "left" 
    ? adSpots.slice(0, midpoint)
    : adSpots.slice(midpoint);
  
  // Calculate how many sponsors to show
  const maxSponsors = side === "left" ? totalSlots : totalSlots - 1; // Right side reserves 1 spot for "Advertise"
  const sponsors = sideSpots.slice(0, maxSponsors);
  const emptySlots = Math.max(0, maxSponsors - sponsors.length);

  return (
    <div className={`hidden lg:flex fixed ${side === "left" ? "left-8" : "right-8"} top-1/2 -translate-y-1/2 flex-col gap-2 w-[220px] max-h-[600px] pb-4`}>
      {/* Sponsor cards */}
      {sponsors.map((sponsor, index) => (
        <Card
          key={`${sponsor.company_name}-${index}-${currentIndex}`}
          className="flex-shrink-0 h-[110px] flex flex-col items-start justify-center gap-1.5 px-4 py-3 bg-card border-border hover:bg-muted/50 transition-all duration-300 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 w-full">
            <img
              src={`https://logo.clearbit.com/${sponsor.domain}`}
              alt={`${sponsor.company_name} logo`}
              className="h-8 w-8 object-contain flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm text-foreground">
              {sponsor.company_name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
            {sponsor.description}
          </p>
        </Card>
      ))}

      {/* Empty ad spots with megaphone icon */}
      {Array.from({ length: Math.min(emptySlots, totalSlots - sponsors.length) }).map((_, index) => (
        <Card
          key={`empty-${index}`}
          onClick={onAdvertiseClick}
          className="flex-shrink-0 h-[110px] flex items-center justify-center px-4 py-3 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
        >
          <Megaphone className="h-5 w-5 text-muted-foreground" />
        </Card>
      ))}

      {/* Empty ad spots with megaphone icon */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <Card
          key={`empty-${index}`}
          onClick={onAdvertiseClick}
          className="flex-shrink-0 h-[110px] flex items-center justify-center px-4 py-3 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
        >
          <Megaphone className="h-5 w-5 text-muted-foreground" />
        </Card>
      ))}

      {/* Advertise spot at bottom - only on right side */}
      {side === "right" && (
        <Card
          onClick={onAdvertiseClick}
          className="flex-shrink-0 h-[110px] flex flex-col items-start justify-center gap-1.5 px-4 py-3 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
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
