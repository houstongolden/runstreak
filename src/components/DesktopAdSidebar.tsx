import { Card } from "@/components/ui/card";
import { getCompanyLogoUrl } from "@/lib/avatars";

interface DesktopAdSidebarProps {
  side: "left" | "right";
  onAdvertiseClick: () => void;
}

const allSponsors = [
  { name: "Strava", domain: "strava.com" },
  { name: "On Running", domain: "on-running.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Whoop", domain: "whoop.com" },
  { name: "BPN", domain: "bareperformancenutrition.com" },
  { name: "Hoka", domain: "hoka.com" },
];

export const DesktopAdSidebar = ({ side, onAdvertiseClick }: DesktopAdSidebarProps) => {
  // Split sponsors so left and right sidebars show different companies
  const sponsors = side === "left" 
    ? allSponsors.slice(0, 3) 
    : allSponsors.slice(3, 6);

  return (
    <div className={`hidden lg:flex fixed ${side === "left" ? "left-4" : "right-4"} top-24 flex-col gap-3 w-[160px] max-h-[70vh] overflow-y-auto scrollbar-hide pb-4`}>
      {/* Sponsor cards */}
      {sponsors.map((sponsor, index) => (
        <Card
          key={`${sponsor.name}-${index}`}
          className="flex-shrink-0 h-[140px] flex flex-col items-center justify-center gap-2 px-2 bg-card border-border hover:bg-muted/50 transition-colors"
        >
          <img
            src={getCompanyLogoUrl(sponsor.name)}
            alt={`${sponsor.name} logo`}
            className="h-10 w-10 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="font-semibold text-xs text-foreground text-center">
            {sponsor.name}
          </span>
        </Card>
      ))}

      {/* Advertise spot at bottom */}
      <Card
        onClick={onAdvertiseClick}
        className="flex-shrink-0 h-[140px] flex flex-col items-center justify-center gap-2 px-2 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
      >
        <span className="font-semibold text-xs text-foreground text-center">Advertise</span>
        <span className="text-xs text-muted-foreground text-center">Your spot here</span>
      </Card>
    </div>
  );
};
