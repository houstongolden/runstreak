import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { getCompanyLogoUrl } from "@/lib/avatars";

interface SponsorCarouselProps {
  direction?: "left" | "right";
  onAdvertiseClick?: () => void;
}

const sponsors = [
  { name: "HypeProxies", domain: "hypeproxies.com" },
  { name: "Okara", domain: "okara.ai" },
  { name: "Whisper Memos", domain: "whispermemos.com" },
  { name: "Pledge.to", domain: "pledge.to" },
  { name: "BAMF", domain: "bamf.com" },
  { name: "TrustMRR", domain: "trustmrr.com" },
];

export const SponsorCarousel = ({ direction = "left", onAdvertiseClick }: SponsorCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = direction === "left" ? 0.5 : -0.5;
    let animationFrameId: number;

    const scroll = () => {
      if (!scrollContainer) return;
      
      scrollContainer.scrollLeft += scrollSpeed;

      // Reset scroll position for infinite loop
      const maxScroll = scrollContainer.scrollWidth / 2;
      if (direction === "left" && scrollContainer.scrollLeft >= maxScroll) {
        scrollContainer.scrollLeft = 0;
      } else if (direction === "right" && scrollContainer.scrollLeft <= 0) {
        scrollContainer.scrollLeft = maxScroll;
      }
      
      animationFrameId = requestAnimationFrame(scroll);
    };

    // Initialize scroll position for right direction
    if (direction === "right") {
      scrollContainer.scrollLeft = scrollContainer.scrollWidth / 2;
    }

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [direction]);

  // Duplicate sponsors multiple times for seamless loop
  const allSponsors = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="w-full overflow-hidden py-4 bg-background border-y border-border lg:hidden">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-scroll scrollbar-hide"
        style={{ scrollBehavior: "auto" }}
      >
        {/* Advertise spot */}
        <Card
          onClick={onAdvertiseClick}
          className="flex-shrink-0 w-[160px] h-[60px] flex items-center justify-center gap-2 px-3 bg-foreground/5 dark:bg-background/5 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
        >
          <span className="font-semibold text-xs text-foreground">Advertise</span>
        </Card>

        {allSponsors.map((sponsor, index) => (
          <Card
            key={`${sponsor.name}-${index}`}
            className="flex-shrink-0 w-[160px] h-[60px] flex items-center justify-center gap-2 px-3 bg-card border-border hover:bg-muted/50 transition-colors"
          >
            <img
              src={getCompanyLogoUrl(sponsor.name)}
              alt={`${sponsor.name} logo`}
              className="h-6 w-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="font-semibold text-xs text-foreground truncate">
              {sponsor.name}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
